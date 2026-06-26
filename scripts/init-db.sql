-- DATAhub — Initialisation base de données Docker
-- Exécuté automatiquement au premier démarrage du container PostgreSQL

-- Extensions utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Recherche textuelle

-- Vérification du rôle (déjà créé via POSTGRES_USER)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'datahub_user') THEN
    CREATE ROLE datahub_user WITH LOGIN PASSWORD 'Planck55';
  END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE datahub TO datahub_user;
GRANT ALL ON SCHEMA public TO datahub_user;

-- Note: Les tables sont créées par Prisma migrate deploy au démarrage du backend
