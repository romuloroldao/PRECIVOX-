-- Migration: Cleanup Mock Data and Create Customers/Payment Plans Tables
-- Version: 003
-- Description: Remove mock data and create dedicated customers and payment plans tables

-- =====================================================
-- LIMPAR DADOS MOCK
-- =====================================================

-- Remover mercados de exemplo (criados na migration 001)
DELETE FROM market_users WHERE market_id IN (
    SELECT id FROM markets WHERE slug IN ('supermercado-vila-nova', 'mercado-central', 'hiper-atacadao-franco')
);

DELETE FROM subscriptions WHERE market_id IN (
    SELECT id FROM markets WHERE slug IN ('supermercado-vila-nova', 'mercado-central', 'hiper-atacadao-franco')
);

DELETE FROM markets WHERE slug IN ('supermercado-vila-nova', 'mercado-central', 'hiper-atacadao-franco');

-- Nota: Mantemos o usuário admin pois é necessário para administração do sistema

-- =====================================================
-- TABELA DE CLIENTES (CUSTOMERS)
-- =====================================================
-- Tabela dedicada para clientes que fazem compras, separada da tabela users
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    
    -- Informações básicas
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    cpf VARCHAR(14),
    
    -- Endereço
    address_street TEXT,
    address_number VARCHAR(20),
    address_complement TEXT,
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_zip_code VARCHAR(20),
    
    -- Preferências
    preferred_payment_method VARCHAR(50),
    accepts_marketing BOOLEAN DEFAULT true,
    
    -- Programa de fidelidade
    loyalty_points INTEGER DEFAULT 0,
    loyalty_tier VARCHAR(50) DEFAULT 'bronze', -- bronze, silver, gold, platinum
    
    -- Estatísticas
    total_purchases INTEGER DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    last_purchase_date TIMESTAMP,
    average_ticket DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, blocked
    
    -- Observações
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT unique_customer_email_market UNIQUE(market_id, email),
    CONSTRAINT unique_customer_cpf_market UNIQUE(market_id, cpf)
);

-- =====================================================
-- TABELA DE PLANOS DE PAGAMENTO (PAYMENT_PLANS)
-- =====================================================
-- Tabela para gerenciar planos de pagamento personalizados por mercado
CREATE TABLE IF NOT EXISTS payment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    
    -- Informações do plano
    name VARCHAR(255) NOT NULL,
    description TEXT,
    plan_type VARCHAR(50) NOT NULL, -- installment, subscription, prepaid, credit
    
    -- Configurações de parcelas (para plano de crediário/parcelamento)
    max_installments INTEGER DEFAULT 1,
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0.00,
    interest_rate DECIMAL(5, 2) DEFAULT 0.00, -- Taxa de juros (%)
    
    -- Configurações de assinatura (para plano de subscription)
    billing_frequency VARCHAR(20), -- weekly, monthly, yearly
    subscription_price DECIMAL(10, 2),
    
    -- Benefícios
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    cashback_percentage DECIMAL(5, 2) DEFAULT 0.00,
    loyalty_points_multiplier DECIMAL(3, 2) DEFAULT 1.00,
    
    -- Restrições
    min_credit_score INTEGER,
    requires_approval BOOLEAN DEFAULT false,
    available_for_new_customers BOOLEAN DEFAULT true,
    
    -- Datas de validade
    valid_from DATE,
    valid_until DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Ordem de exibição
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT valid_interest_rate CHECK (interest_rate >= 0 AND interest_rate <= 100),
    CONSTRAINT valid_discount CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    CONSTRAINT valid_cashback CHECK (cashback_percentage >= 0 AND cashback_percentage <= 100)
);

-- =====================================================
-- TABELA DE TRANSAÇÕES DE CLIENTES (CUSTOMER_TRANSACTIONS)
-- =====================================================
-- Histórico de compras e transações dos clientes
CREATE TABLE IF NOT EXISTS customer_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    payment_plan_id UUID REFERENCES payment_plans(id),
    
    -- Informações da transação
    transaction_type VARCHAR(50) NOT NULL, -- purchase, payment, refund, credit
    transaction_code VARCHAR(100) UNIQUE NOT NULL,
    
    -- Valores
    amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    final_amount DECIMAL(10, 2) NOT NULL,
    
    -- Pagamento
    payment_method VARCHAR(50), -- cash, credit_card, debit_card, pix, installment
    installments INTEGER DEFAULT 1,
    installment_number INTEGER, -- Para pagamentos parcelados
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled, refunded
    
    -- Pontos de fidelidade
    loyalty_points_earned INTEGER DEFAULT 0,
    
    -- Descrição
    description TEXT,
    notes TEXT,
    
    -- Datas
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE, -- Para parcelas
    paid_date TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Customers indexes
CREATE INDEX idx_customers_market_id ON customers(market_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_cpf ON customers(cpf);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_loyalty_tier ON customers(loyalty_tier);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- Payment plans indexes
CREATE INDEX idx_payment_plans_market_id ON payment_plans(market_id);
CREATE INDEX idx_payment_plans_plan_type ON payment_plans(plan_type);
CREATE INDEX idx_payment_plans_active ON payment_plans(is_active);
CREATE INDEX idx_payment_plans_default ON payment_plans(is_default);

-- Customer transactions indexes
CREATE INDEX idx_customer_transactions_customer_id ON customer_transactions(customer_id);
CREATE INDEX idx_customer_transactions_market_id ON customer_transactions(market_id);
CREATE INDEX idx_customer_transactions_payment_plan_id ON customer_transactions(payment_plan_id);
CREATE INDEX idx_customer_transactions_status ON customer_transactions(status);
CREATE INDEX idx_customer_transactions_date ON customer_transactions(transaction_date);
CREATE INDEX idx_customer_transactions_code ON customer_transactions(transaction_code);

-- =====================================================
-- TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Trigger para atualizar updated_at em customers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em payment_plans
CREATE TRIGGER update_payment_plans_updated_at BEFORE UPDATE ON payment_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em customer_transactions
CREATE TRIGGER update_customer_transactions_updated_at BEFORE UPDATE ON customer_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar estatísticas do cliente
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar estatísticas do cliente quando uma transação for concluída
    IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status != 'completed') THEN
        UPDATE customers SET
            total_purchases = total_purchases + 1,
            total_spent = total_spent + NEW.final_amount,
            last_purchase_date = NEW.transaction_date,
            average_ticket = (total_spent + NEW.final_amount) / (total_purchases + 1),
            loyalty_points = loyalty_points + NEW.loyalty_points_earned,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.customer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_stats_trigger 
    AFTER INSERT OR UPDATE ON customer_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- Trigger para garantir apenas um plano padrão por mercado
CREATE OR REPLACE FUNCTION ensure_single_default_payment_plan()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        -- Desativar is_default de todos os outros planos do mesmo mercado
        UPDATE payment_plans 
        SET is_default = false 
        WHERE market_id = NEW.market_id 
        AND id != NEW.id 
        AND is_default = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_payment_plan_trigger 
    BEFORE INSERT OR UPDATE ON payment_plans 
    FOR EACH ROW EXECUTE FUNCTION ensure_single_default_payment_plan();

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter clientes de um mercado
CREATE OR REPLACE FUNCTION get_market_customers(
    market_uuid UUID,
    status_filter VARCHAR DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    total_purchases INTEGER,
    total_spent DECIMAL,
    loyalty_tier VARCHAR,
    last_purchase_date TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.total_purchases,
        c.total_spent,
        c.loyalty_tier,
        c.last_purchase_date
    FROM customers c
    WHERE c.market_id = market_uuid
    AND (status_filter IS NULL OR c.status = status_filter)
    ORDER BY c.total_spent DESC, c.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Função para obter planos de pagamento de um mercado
CREATE OR REPLACE FUNCTION get_market_payment_plans(
    market_uuid UUID,
    active_only BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    plan_type VARCHAR,
    max_installments INTEGER,
    interest_rate DECIMAL,
    discount_percentage DECIMAL,
    is_default BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.id,
        pp.name,
        pp.description,
        pp.plan_type,
        pp.max_installments,
        pp.interest_rate,
        pp.discount_percentage,
        pp.is_default
    FROM payment_plans pp
    WHERE pp.market_id = market_uuid
    AND (active_only = false OR pp.is_active = true)
    ORDER BY pp.is_default DESC, pp.display_order ASC, pp.name ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View de clientes com estatísticas
CREATE VIEW v_customers_stats AS
SELECT 
    c.*,
    m.name as market_name,
    m.slug as market_slug,
    COUNT(DISTINCT ct.id) as transaction_count,
    COALESCE(SUM(ct.loyalty_points_earned), 0) as total_loyalty_points_earned
FROM customers c
LEFT JOIN markets m ON c.market_id = m.id
LEFT JOIN customer_transactions ct ON c.id = ct.customer_id AND ct.status = 'completed'
GROUP BY c.id, m.name, m.slug;

-- View de planos de pagamento ativos
CREATE VIEW v_active_payment_plans AS
SELECT 
    pp.*,
    m.name as market_name,
    m.slug as market_slug,
    COUNT(DISTINCT ct.id) as usage_count
FROM payment_plans pp
LEFT JOIN markets m ON pp.market_id = m.id
LEFT JOIN customer_transactions ct ON pp.id = ct.payment_plan_id
WHERE pp.is_active = true
AND (pp.valid_until IS NULL OR pp.valid_until >= CURRENT_DATE)
GROUP BY pp.id, m.name, m.slug;

-- =====================================================
-- LOG DA MIGRATION
-- =====================================================

INSERT INTO audit_logs (action, resource_type, description, metadata)
VALUES (
    'migration',
    'database',
    'Cleanup mock data and created customers/payment_plans tables',
    '{"migration_version": "003", "tables_created": ["customers", "payment_plans", "customer_transactions"], "mock_data_removed": true}'::jsonb
);

COMMIT;

