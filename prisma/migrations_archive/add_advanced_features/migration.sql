-- Migration: Adicionar tabelas para features avançadas
-- A/B Testing e Push Notifications

-- Tabela para subscriptions de push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    active BOOLEAN DEFAULT true,
    UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(active);

-- Tabela para testes A/B
CREATE TABLE IF NOT EXISTS ab_tests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('PRICING', 'RECOMMENDATION', 'LAYOUT', 'FEATURE')),
    traffic_split INTEGER DEFAULT 50 CHECK (traffic_split >= 0 AND traffic_split <= 100),
    start_date TIMESTAMP NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED')),
    variants JSONB NOT NULL,
    metrics JSONB DEFAULT '{"totalUsers": 0, "variantMetrics": {}, "confidence": 0, "winner": null}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT REFERENCES usuarios(id)
);

CREATE INDEX idx_ab_tests_status ON ab_tests(status);
CREATE INDEX idx_ab_tests_type ON ab_tests(type);
CREATE INDEX idx_ab_tests_dates ON ab_tests(start_date, end_date);

-- Tabela para resultados de testes A/B
CREATE TABLE IF NOT EXISTS ab_test_results (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    test_id TEXT NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL,
    action TEXT,
    value DECIMAL(10, 2),
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT NOW(),
    UNIQUE(test_id, user_id, variant_id, action, timestamp)
);

CREATE INDEX idx_ab_test_results_test_id ON ab_test_results(test_id);
CREATE INDEX idx_ab_test_results_user_id ON ab_test_results(user_id);
CREATE INDEX idx_ab_test_results_variant_id ON ab_test_results(variant_id);
CREATE INDEX idx_ab_test_results_timestamp ON ab_test_results(timestamp);

-- Tabela para atribuições de variants (cache)
CREATE TABLE IF NOT EXISTS ab_test_assignments (
    test_id TEXT NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (test_id, user_id)
);

CREATE INDEX idx_ab_test_assignments_user_id ON ab_test_assignments(user_id);
CREATE INDEX idx_ab_test_assignments_test_id ON ab_test_assignments(test_id);

