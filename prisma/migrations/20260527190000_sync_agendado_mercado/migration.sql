-- Épico 9.1 — configuração de sync agendado por mercado (URL/SFTP)
ALTER TABLE mercados ADD COLUMN IF NOT EXISTS sync_agendado JSONB;
