-- Migration: Create Products Table and JSON Upload System
-- Version: 002
-- Description: Products management and JSON file processing

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    
    -- Product basic information
    external_id VARCHAR(255), -- ID from uploaded JSON
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100),
    subcategoria VARCHAR(100),
    preco DECIMAL(10, 2) NOT NULL,
    
    -- Market/Store information (from JSON)
    loja VARCHAR(255),
    endereco TEXT,
    telefone VARCHAR(20),
    
    -- Product details
    marca VARCHAR(100),
    codigo_barras VARCHAR(50),
    peso VARCHAR(20),
    origem VARCHAR(50),
    
    -- Stock and availability
    estoque INTEGER DEFAULT 0,
    disponivel BOOLEAN DEFAULT true,
    
    -- Promotions
    promocao BOOLEAN DEFAULT false,
    desconto DECIMAL(5, 2) DEFAULT 0.00,
    preco_original DECIMAL(10, 2),
    
    -- Ratings and performance
    avaliacao DECIMAL(3, 2) DEFAULT 0.00,
    visualizacoes INTEGER DEFAULT 0,
    conversoes INTEGER DEFAULT 0,
    
    -- Image URLs
    imagem_url TEXT,
    imagens_adicionais JSONB,
    
    -- Search optimization
    search_vector tsvector,
    
    -- Data source tracking
    data_source VARCHAR(50) DEFAULT 'json_upload', -- 'json_upload', 'manual', 'api'
    json_source_file VARCHAR(255), -- Name of uploaded JSON file
    last_updated_from_source TIMESTAMP,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'out_of_stock'
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    UNIQUE(market_id, external_id), -- Prevent duplicates from same JSON
    CONSTRAINT positive_price CHECK (preco > 0),
    CONSTRAINT valid_discount CHECK (desconto >= 0 AND desconto <= 100)
);

-- =====================================================
-- JSON_UPLOADS TABLE (Track uploaded JSON files)
-- =====================================================
CREATE TABLE json_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    
    -- File information
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash to detect duplicates
    
    -- Processing status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    
    -- Processing results
    total_products INTEGER DEFAULT 0,
    products_created INTEGER DEFAULT 0,
    products_updated INTEGER DEFAULT 0,
    products_failed INTEGER DEFAULT 0,
    
    -- Error tracking
    error_message TEXT,
    error_details JSONB,
    
    -- Processing times
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    processing_duration INTEGER, -- seconds
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    -- Prevent duplicate uploads
    UNIQUE(market_id, file_hash)
);

-- =====================================================
-- PRODUCT_CATEGORIES TABLE (Auto-generated from products)
-- =====================================================
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    
    -- Category information
    categoria VARCHAR(100) NOT NULL,
    subcategoria VARCHAR(100),
    
    -- Statistics
    product_count INTEGER DEFAULT 0,
    avg_price DECIMAL(10, 2) DEFAULT 0.00,
    min_price DECIMAL(10, 2) DEFAULT 0.00,
    max_price DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(market_id, categoria, subcategoria)
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- Products indexes
CREATE INDEX idx_products_market_id ON products(market_id);
CREATE INDEX idx_products_categoria ON products(categoria);
CREATE INDEX idx_products_preco ON products(preco);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_promocao ON products(promocao);
CREATE INDEX idx_products_search_vector ON products USING gin(search_vector);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_external_id ON products(external_id);
CREATE INDEX idx_products_codigo_barras ON products(codigo_barras);

-- JSON uploads indexes
CREATE INDEX idx_json_uploads_market_id ON json_uploads(market_id);
CREATE INDEX idx_json_uploads_status ON json_uploads(status);
CREATE INDEX idx_json_uploads_created_at ON json_uploads(created_at);
CREATE INDEX idx_json_uploads_file_hash ON json_uploads(file_hash);

-- Product categories indexes
CREATE INDEX idx_product_categories_market_id ON product_categories(market_id);
CREATE INDEX idx_product_categories_categoria ON product_categories(categoria);

-- =====================================================
-- TRIGGERS for automatic updates
-- =====================================================

-- Apply updated_at trigger to products table
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to product_categories table
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update product search vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('portuguese', COALESCE(NEW.nome, '')), 'A') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.categoria, '')), 'B') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.subcategoria, '')), 'B') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.marca, '')), 'C') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.loja, '')), 'D');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply search vector trigger to products
CREATE TRIGGER update_product_search_vector_trigger 
    BEFORE INSERT OR UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Function to update category statistics
CREATE OR REPLACE FUNCTION update_category_stats()
RETURNS TRIGGER AS $$
DECLARE
    categoria_record product_categories%ROWTYPE;
BEGIN
    -- Handle INSERT or UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Insert or update category stats for new/updated product
        INSERT INTO product_categories (market_id, categoria, subcategoria, product_count, avg_price, min_price, max_price)
        SELECT 
            NEW.market_id,
            NEW.categoria,
            NEW.subcategoria,
            COUNT(*),
            AVG(preco),
            MIN(preco),
            MAX(preco)
        FROM products 
        WHERE market_id = NEW.market_id 
        AND categoria = NEW.categoria 
        AND COALESCE(subcategoria, '') = COALESCE(NEW.subcategoria, '')
        AND status = 'active'
        GROUP BY market_id, categoria, subcategoria
        ON CONFLICT (market_id, categoria, subcategoria)
        DO UPDATE SET
            product_count = EXCLUDED.product_count,
            avg_price = EXCLUDED.avg_price,
            min_price = EXCLUDED.min_price,
            max_price = EXCLUDED.max_price,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Handle UPDATE (old category if changed)
    IF TG_OP = 'UPDATE' AND (OLD.categoria != NEW.categoria OR COALESCE(OLD.subcategoria, '') != COALESCE(NEW.subcategoria, '')) THEN
        -- Update stats for old category
        INSERT INTO product_categories (market_id, categoria, subcategoria, product_count, avg_price, min_price, max_price)
        SELECT 
            OLD.market_id,
            OLD.categoria,
            OLD.subcategoria,
            COUNT(*),
            COALESCE(AVG(preco), 0),
            COALESCE(MIN(preco), 0),
            COALESCE(MAX(preco), 0)
        FROM products 
        WHERE market_id = OLD.market_id 
        AND categoria = OLD.categoria 
        AND COALESCE(subcategoria, '') = COALESCE(OLD.subcategoria, '')
        AND status = 'active'
        GROUP BY market_id, categoria, subcategoria
        ON CONFLICT (market_id, categoria, subcategoria)
        DO UPDATE SET
            product_count = EXCLUDED.product_count,
            avg_price = EXCLUDED.avg_price,
            min_price = EXCLUDED.min_price,
            max_price = EXCLUDED.max_price,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        -- Update stats for deleted product's category
        INSERT INTO product_categories (market_id, categoria, subcategoria, product_count, avg_price, min_price, max_price)
        SELECT 
            OLD.market_id,
            OLD.categoria,
            OLD.subcategoria,
            COUNT(*),
            COALESCE(AVG(preco), 0),
            COALESCE(MIN(preco), 0),
            COALESCE(MAX(preco), 0)
        FROM products 
        WHERE market_id = OLD.market_id 
        AND categoria = OLD.categoria 
        AND COALESCE(subcategoria, '') = COALESCE(OLD.subcategoria, '')
        AND status = 'active'
        GROUP BY market_id, categoria, subcategoria
        ON CONFLICT (market_id, categoria, subcategoria)
        DO UPDATE SET
            product_count = EXCLUDED.product_count,
            avg_price = EXCLUDED.avg_price,
            min_price = EXCLUDED.min_price,
            max_price = EXCLUDED.max_price,
            updated_at = CURRENT_TIMESTAMP;
        
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply category stats trigger to products
CREATE TRIGGER update_category_stats_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_category_stats();

-- =====================================================
-- FUNCTIONS for common operations
-- =====================================================

-- Function to search products
CREATE OR REPLACE FUNCTION search_products(
    search_term TEXT DEFAULT NULL,
    market_uuid UUID DEFAULT NULL,
    categoria_filter VARCHAR DEFAULT NULL,
    preco_min DECIMAL DEFAULT NULL,
    preco_max DECIMAL DEFAULT NULL,
    promocao_only BOOLEAN DEFAULT FALSE,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    nome VARCHAR,
    categoria VARCHAR,
    subcategoria VARCHAR,
    preco DECIMAL,
    loja VARCHAR,
    promocao BOOLEAN,
    desconto DECIMAL,
    avaliacao DECIMAL,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nome,
        p.categoria,
        p.subcategoria,
        p.preco,
        p.loja,
        p.promocao,
        p.desconto,
        p.avaliacao,
        CASE 
            WHEN search_term IS NOT NULL THEN
                ts_rank_cd(p.search_vector, plainto_tsquery('portuguese', search_term))
            ELSE 0.0
        END as rank
    FROM products p
    WHERE p.status = 'active'
    AND (market_uuid IS NULL OR p.market_id = market_uuid)
    AND (search_term IS NULL OR p.search_vector @@ plainto_tsquery('portuguese', search_term))
    AND (categoria_filter IS NULL OR p.categoria = categoria_filter)
    AND (preco_min IS NULL OR p.preco >= preco_min)
    AND (preco_max IS NULL OR p.preco <= preco_max)
    AND (promocao_only = FALSE OR p.promocao = TRUE)
    ORDER BY 
        CASE WHEN search_term IS NOT NULL THEN rank ELSE 0 END DESC,
        p.promocao DESC,
        p.preco ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get product statistics for a market
CREATE OR REPLACE FUNCTION get_market_product_stats(market_uuid UUID)
RETURNS TABLE (
    total_products INTEGER,
    total_categories INTEGER,
    avg_price DECIMAL,
    products_in_promotion INTEGER,
    out_of_stock INTEGER,
    last_update TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_products,
        COUNT(DISTINCT categoria)::INTEGER as total_categories,
        AVG(preco) as avg_price,
        COUNT(*) FILTER (WHERE promocao = true)::INTEGER as products_in_promotion,
        COUNT(*) FILTER (WHERE estoque = 0)::INTEGER as out_of_stock,
        MAX(updated_at) as last_update
    FROM products
    WHERE market_id = market_uuid AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS for common queries
-- =====================================================

-- View for products with market information
CREATE VIEW v_products_with_market AS
SELECT 
    p.*,
    m.name as market_name,
    m.slug as market_slug,
    m.address_city,
    m.address_state,
    m.verified as market_verified
FROM products p
JOIN markets m ON p.market_id = m.id
WHERE p.status = 'active' AND m.status = 'active';

-- View for product categories with statistics
CREATE VIEW v_product_categories_stats AS
SELECT 
    pc.*,
    m.name as market_name,
    m.slug as market_slug
FROM product_categories pc
JOIN markets m ON pc.market_id = m.id
WHERE pc.is_active = true AND m.status = 'active'
ORDER BY pc.product_count DESC;

-- View for promoted products
CREATE VIEW v_promoted_products AS
SELECT 
    p.*,
    m.name as market_name,
    m.slug as market_slug,
    (p.preco * (1 - p.desconto/100)) as preco_promocional
FROM products p
JOIN markets m ON p.market_id = m.id
WHERE p.promocao = true 
AND p.status = 'active' 
AND m.status = 'active'
ORDER BY p.desconto DESC, p.preco ASC;

-- Log the migration
INSERT INTO audit_logs (action, resource_type, description, metadata)
VALUES (
    'migration',
    'database',
    'Products table and JSON upload system created',
    '{"migration_version": "002", "tables_created": ["products", "json_uploads", "product_categories"]}'::jsonb
);

COMMIT;