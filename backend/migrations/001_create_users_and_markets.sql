-- Migration: Create Users and Markets Schema
-- Version: 001
-- Description: Initial database structure for PRECIVOX system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('cliente', 'gestor', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
CREATE TYPE market_status AS ENUM ('active', 'pending', 'suspended', 'inactive');
CREATE TYPE subscription_plan AS ENUM ('basic', 'premium', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'pending');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'cliente',
    status user_status NOT NULL DEFAULT 'pending_verification',
    
    -- Profile information
    avatar_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),
    
    -- Address information
    address_street TEXT,
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_zip_code VARCHAR(20),
    address_country VARCHAR(50) DEFAULT 'Brasil',
    
    -- Preferences
    preferred_language VARCHAR(10) DEFAULT 'pt-BR',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    
    -- Security
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    
    -- Login tracking
    last_login TIMESTAMP,
    last_login_ip INET,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- =====================================================
-- MARKETS TABLE
-- =====================================================
CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    
    -- Business information
    cnpj VARCHAR(18) UNIQUE,
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    website_url TEXT,
    
    -- Contact information
    email VARCHAR(255),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    
    -- Address information
    address_street TEXT NOT NULL,
    address_number VARCHAR(20),
    address_complement TEXT,
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100) NOT NULL,
    address_state VARCHAR(50) NOT NULL,
    address_zip_code VARCHAR(20) NOT NULL,
    address_country VARCHAR(50) DEFAULT 'Brasil',
    
    -- Geographic coordinates
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Operating hours (JSON format)
    operating_hours JSONB,
    
    -- Market information
    category VARCHAR(100),
    size_category VARCHAR(50), -- 'small', 'medium', 'large', 'supermarket', 'hypermarket'
    delivery_available BOOLEAN DEFAULT false,
    pickup_available BOOLEAN DEFAULT true,
    payment_methods JSONB, -- Array of accepted payment methods
    
    -- Status and verification
    status market_status NOT NULL DEFAULT 'pending',
    verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP,
    
    -- Images and media
    logo_url TEXT,
    cover_image_url TEXT,
    gallery_images JSONB, -- Array of image URLs
    
    -- Statistics
    total_products INTEGER DEFAULT 0,
    total_categories INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    
    -- Database configuration
    has_database BOOLEAN DEFAULT false,
    last_data_sync TIMESTAMP,
    data_sync_frequency INTEGER DEFAULT 24, -- hours
    database_size_mb DECIMAL(10, 2) DEFAULT 0.00,
    total_records INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Search optimization
    search_vector tsvector
);

-- =====================================================
-- MARKET_USERS (Relationship between users and markets)
-- =====================================================
CREATE TABLE market_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'manager', -- 'owner', 'manager', 'employee', 'viewer'
    permissions JSONB, -- Specific permissions for this user in this market
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    UNIQUE(market_id, user_id)
);

-- =====================================================
-- SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    
    -- Plan information
    plan subscription_plan NOT NULL DEFAULT 'basic',
    status subscription_status NOT NULL DEFAULT 'pending',
    billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
    
    -- Pricing
    monthly_price DECIMAL(10, 2) NOT NULL,
    yearly_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    
    -- Dates
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    next_billing_date TIMESTAMP NOT NULL,
    last_payment_date TIMESTAMP,
    
    -- Payment information
    payment_method VARCHAR(100), -- 'credit_card', 'pix', 'boleto', 'bank_transfer'
    payment_gateway VARCHAR(50), -- 'stripe', 'mercadopago', 'pagseguro'
    payment_gateway_customer_id VARCHAR(255),
    payment_gateway_subscription_id VARCHAR(255),
    
    -- Settings
    auto_renew BOOLEAN DEFAULT true,
    grace_period_days INTEGER DEFAULT 7,
    
    -- Features (JSON with plan features)
    features JSONB,
    
    -- Usage limits
    max_products INTEGER,
    max_users INTEGER,
    max_api_calls INTEGER,
    max_storage_mb INTEGER,
    
    -- Trial information
    is_trial BOOLEAN DEFAULT false,
    trial_end_date TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- =====================================================
-- SUBSCRIPTION_HISTORY (Payment and plan change history)
-- =====================================================
CREATE TABLE subscription_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    
    -- Event information
    event_type VARCHAR(50) NOT NULL, -- 'created', 'payment', 'upgrade', 'downgrade', 'cancelled', 'renewed'
    description TEXT,
    
    -- Payment information
    amount DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'BRL',
    payment_method VARCHAR(100),
    payment_status VARCHAR(50), -- 'pending', 'completed', 'failed', 'refunded'
    payment_gateway_transaction_id VARCHAR(255),
    
    -- Plan information (snapshot at time of event)
    plan_snapshot JSONB,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- =====================================================
-- USER_SESSIONS (Track user login sessions)
-- =====================================================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session information
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    
    -- Device and location information
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    device_os VARCHAR(100),
    device_browser VARCHAR(100),
    location_country VARCHAR(50),
    location_city VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AUDIT_LOGS (System audit trail)
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who performed the action
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES user_sessions(id),
    
    -- What action was performed
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', etc.
    resource_type VARCHAR(100) NOT NULL, -- 'user', 'market', 'subscription', etc.
    resource_id UUID,
    
    -- Additional context
    description TEXT,
    metadata JSONB, -- Additional structured data about the action
    
    -- Where it happened
    ip_address INET,
    user_agent TEXT,
    
    -- When it happened
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login);

-- Markets indexes
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_city_state ON markets(address_city, address_state);
CREATE INDEX idx_markets_location ON markets(latitude, longitude);
CREATE INDEX idx_markets_created_at ON markets(created_at);
CREATE INDEX idx_markets_search_vector ON markets USING gin(search_vector);
CREATE INDEX idx_markets_slug ON markets(slug);

-- Market users indexes
CREATE INDEX idx_market_users_market_id ON market_users(market_id);
CREATE INDEX idx_market_users_user_id ON market_users(user_id);
CREATE INDEX idx_market_users_role ON market_users(role);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_market_id ON subscriptions(market_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);

-- Subscription history indexes
CREATE INDEX idx_subscription_history_subscription_id ON subscription_history(subscription_id);
CREATE INDEX idx_subscription_history_event_type ON subscription_history(event_type);
CREATE INDEX idx_subscription_history_created_at ON subscription_history(created_at);

-- User sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type_id ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- TRIGGERS for automatic updates
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_users_updated_at BEFORE UPDATE ON market_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update market search vector
CREATE OR REPLACE FUNCTION update_market_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.address_city, '')), 'C') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.address_neighborhood, '')), 'D');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply search vector trigger to markets
CREATE TRIGGER update_market_search_vector_trigger 
    BEFORE INSERT OR UPDATE ON markets 
    FOR EACH ROW EXECUTE FUNCTION update_market_search_vector();

-- =====================================================
-- FUNCTIONS for common operations
-- =====================================================

-- Function to get user's markets
CREATE OR REPLACE FUNCTION get_user_markets(user_uuid UUID)
RETURNS TABLE (
    market_id UUID,
    market_name VARCHAR,
    market_slug VARCHAR,
    user_role VARCHAR,
    market_status market_status
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        m.slug,
        mu.role,
        m.status
    FROM markets m
    JOIN market_users mu ON m.id = mu.market_id
    WHERE mu.user_id = user_uuid AND mu.status = 'active'
    ORDER BY m.name;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has permission for market
CREATE OR REPLACE FUNCTION user_has_market_permission(
    user_uuid UUID,
    market_uuid UUID,
    required_permission VARCHAR DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
DECLARE
    user_market_role VARCHAR;
    user_permissions JSONB;
    has_permission BOOLEAN := false;
BEGIN
    -- Get user's role and permissions for the market
    SELECT mu.role, mu.permissions
    INTO user_market_role, user_permissions
    FROM market_users mu
    WHERE mu.user_id = user_uuid 
    AND mu.market_id = market_uuid 
    AND mu.status = 'active';
    
    -- If no relationship found, check if user is admin
    IF user_market_role IS NULL THEN
        SELECT CASE WHEN role = 'admin' THEN true ELSE false END
        INTO has_permission
        FROM users
        WHERE id = user_uuid AND status = 'active';
        
        RETURN COALESCE(has_permission, false);
    END IF;
    
    -- Owner and manager have all permissions
    IF user_market_role IN ('owner', 'manager') THEN
        RETURN true;
    END IF;
    
    -- Check specific permissions in JSONB
    IF user_permissions IS NOT NULL THEN
        has_permission := user_permissions ? required_permission;
    END IF;
    
    RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INSERT INITIAL DATA
-- =====================================================

-- Create default admin user
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    role, 
    status,
    email_verified,
    address_city,
    address_state
) VALUES (
    'admin@precivox.com.br',
    '$2b$12$LQv3c1yqBwrVHpgk6TlVaOQNvApyHB3GOwO6qRJfL1TrABQCKGASu', -- password: admin123
    'Administrador PRECIVOX',
    'admin',
    'active',
    true,
    'São Paulo',
    'SP'
);

-- Create sample markets
INSERT INTO markets (
    name,
    slug,
    description,
    cnpj,
    email,
    phone,
    address_street,
    address_number,
    address_neighborhood,
    address_city,
    address_state,
    address_zip_code,
    status,
    verified,
    category,
    size_category
) VALUES 
(
    'Supermercado Vila Nova',
    'supermercado-vila-nova',
    'Supermercado familiar com os melhores preços de Franco da Rocha',
    '12.345.678/0001-90',
    'contato@vilanova.com.br',
    '(11) 9876-5432',
    'Rua das Flores',
    '123',
    'Vila Nova',
    'Franco da Rocha',
    'SP',
    '07800-000',
    'active',
    true,
    'Supermercado',
    'medium'
),
(
    'Mercado Central',
    'mercado-central',
    'Mercado tradicional no centro da cidade',
    '98.765.432/0001-10',
    'admin@mercadocentral.com.br',
    '(11) 8765-4321',
    'Av. Principal',
    '456',
    'Centro',
    'São Paulo',
    'SP',
    '01000-000',
    'pending',
    false,
    'Mercado',
    'small'
),
(
    'Hiper Atacadão Franco',
    'hiper-atacadao-franco',
    'Atacado e varejo com os melhores preços',
    '11.222.333/0001-44',
    'contato@atacadaofranco.com.br',
    '(11) 7777-8888',
    'Rodovia Presidente Dutra',
    'Km 32',
    'Distrito Industrial',
    'Franco da Rocha',
    'SP',
    '07800-100',
    'active',
    true,
    'Atacadista',
    'large'
);

-- Link admin user to sample markets
DO $$
DECLARE
    admin_user_id UUID;
    market_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@precivox.com.br';
    
    -- Link admin to all markets as owner
    FOR market_id IN SELECT id FROM markets
    LOOP
        INSERT INTO market_users (market_id, user_id, role, created_by)
        VALUES (market_id, admin_user_id, 'owner', admin_user_id);
    END LOOP;
END $$;

-- Create sample subscriptions
DO $$
DECLARE
    market_id UUID;
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@precivox.com.br';
    
    -- Premium subscription for Supermercado Vila Nova
    SELECT id INTO market_id FROM markets WHERE slug = 'supermercado-vila-nova';
    INSERT INTO subscriptions (
        market_id,
        plan,
        status,
        billing_cycle,
        monthly_price,
        yearly_price,
        start_date,
        end_date,
        next_billing_date,
        payment_method,
        features,
        max_products,
        max_users,
        created_by
    ) VALUES (
        market_id,
        'premium',
        'active',
        'monthly',
        199.90,
        1999.00,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '1 year',
        CURRENT_TIMESTAMP + INTERVAL '1 month',
        'credit_card',
        '["unlimited_products", "advanced_analytics", "priority_support", "custom_branding"]'::jsonb,
        -1, -- unlimited
        10,
        admin_user_id
    );
    
    -- Basic subscription for Mercado Central
    SELECT id INTO market_id FROM markets WHERE slug = 'mercado-central';
    INSERT INTO subscriptions (
        market_id,
        plan,
        status,
        billing_cycle,
        monthly_price,
        yearly_price,
        start_date,
        end_date,
        next_billing_date,
        payment_method,
        features,
        max_products,
        max_users,
        created_by
    ) VALUES (
        market_id,
        'basic',
        'active',
        'monthly',
        99.90,
        999.00,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '1 year',
        CURRENT_TIMESTAMP + INTERVAL '1 month',
        'pix',
        '["up_to_1000_products", "basic_analytics", "email_support"]'::jsonb,
        1000,
        3,
        admin_user_id
    );
END $$;

-- Log the migration
INSERT INTO audit_logs (action, resource_type, description, metadata)
VALUES (
    'migration',
    'database',
    'Initial database schema created',
    '{"migration_version": "001", "tables_created": ["users", "markets", "market_users", "subscriptions", "subscription_history", "user_sessions", "audit_logs"]}'::jsonb
);

-- =====================================================
-- VIEWS for common queries
-- =====================================================

-- View for active markets with subscription info
CREATE VIEW v_active_markets AS
SELECT 
    m.*,
    s.plan as subscription_plan,
    s.status as subscription_status,
    s.end_date as subscription_end_date,
    s.next_billing_date,
    CASE 
        WHEN s.end_date < CURRENT_TIMESTAMP THEN 'expired'
        WHEN s.end_date < CURRENT_TIMESTAMP + INTERVAL '30 days' THEN 'expiring_soon'
        ELSE 'active'
    END as subscription_health
FROM markets m
LEFT JOIN subscriptions s ON m.id = s.market_id AND s.status = 'active'
WHERE m.status = 'active';

-- View for user dashboard with market count and role info
CREATE VIEW v_user_dashboard AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.status,
    u.last_login,
    COUNT(DISTINCT mu.market_id) as market_count,
    json_agg(
        CASE WHEN mu.market_id IS NOT NULL THEN
            json_build_object(
                'market_id', m.id,
                'market_name', m.name,
                'market_slug', m.slug,
                'user_role', mu.role,
                'market_status', m.status
            )
        END
    ) FILTER (WHERE mu.market_id IS NOT NULL) as markets
FROM users u
LEFT JOIN market_users mu ON u.id = mu.user_id AND mu.status = 'active'
LEFT JOIN markets m ON mu.market_id = m.id
GROUP BY u.id, u.name, u.email, u.role, u.status, u.last_login;

COMMIT;