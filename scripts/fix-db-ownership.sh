#!/bin/bash
# Corrige ownership PostgreSQL para precivox_app (migrations automáticas).
# Uso: sudo bash scripts/fix-db-ownership.sh
set -euo pipefail

DB_USER="${DB_USER:-precivox_app}"
DB_NAME="${DB_NAME:-precivox}"

echo ">>> Transferindo ownership de $DB_NAME para $DB_USER"

sudo -u postgres psql -d "$DB_NAME" <<EOF
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
ALTER SCHEMA public OWNER TO $DB_USER;
DO \$\$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO $DB_USER', r.tablename);
  END LOOP;
  FOR r IN SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO $DB_USER', r.sequencename);
  END LOOP;
END \$\$;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF

echo ">>> Verificando migrate deploy..."
cd /home/deploy/apps/precivox
set -a && source .env.production && set +a
npx prisma migrate deploy

echo "✅ Ownership e migrations OK"
