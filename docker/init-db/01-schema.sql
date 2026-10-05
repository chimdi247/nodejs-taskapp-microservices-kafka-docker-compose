-- ============================================================
-- Node Microservices schema bootstrap (PostgreSQL)
-- ============================================================
-- Runs automatically the FIRST time the db container starts against
-- an empty data volume (official postgres image behavior for
-- /docker-entrypoint-initdb.d). It will NOT re-run against an
-- existing volume -- see docker/README.md to reset it.
--
-- This is the project's own sql/001..004_*.sql migration files,
-- concatenated in order (those still exist as the source of truth
-- and can be run individually via `npm run db:migrate`; this file
-- just bundles them for the automatic first-boot path).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---- from sql/001_users.sql ----
CREATE TABLE IF NOT EXISTS users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- from sql/002_tasks.sql ----
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks (created_by);

-- ---- from sql/003_attachments.sql ----

CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    public_id TEXT NOT NULL,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments (task_id);

-- ---- from sql/004_workflows.sql ----
CREATE TABLE IF NOT EXISTS task_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_task_workflows_task_id ON task_workflows (task_id);

