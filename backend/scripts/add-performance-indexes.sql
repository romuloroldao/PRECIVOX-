-- Script para adicionar índices de performance
-- Executar como: psql -d precivox -f add-performance-indexes.sql

-- Índices para mercados
CREATE INDEX IF NOT EXISTS idx_markets_cnpj ON markets(cnpj) WHERE status != 'inactive';
CREATE INDEX IF NOT EXISTS idx_markets_slug ON markets(slug);
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_verified ON markets(verified);
CREATE INDEX IF NOT EXISTS idx_markets_created_by ON markets(created_by);

-- Índices para usuários de mercado
CREATE INDEX IF NOT EXISTS idx_market_users_user_id ON market_users(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_market_users_market_id ON market_users(market_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_market_users_role ON market_users(role);
CREATE INDEX IF NOT EXISTS idx_market_users_status ON market_users(status);

-- Índices para usuários
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Verificar índices criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('markets', 'market_users', 'users', 'audit_logs')
ORDER BY tablename, indexname;
