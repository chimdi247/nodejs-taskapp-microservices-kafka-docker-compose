-- ============================================================
-- Seed a default admin user
-- ============================================================
--   email:    admin@example.com
--   password: password123
--
-- The hash below is a real bcrypt hash ($2a$, cost 10) matching this
-- app's own bcrypt.hash(password, 10) call exactly (see
-- apps/auth-service/src/services/auth.service.ts) -- pre-computed
-- offline since plain SQL can't run bcrypt itself. bcryptjs verifies
-- it exactly like any hash it generated itself, since it's the same
-- algorithm; the cost factor is embedded in the hash string, so it
-- verifies correctly regardless of what cost the app's own
-- registration flow happens to use.
--
-- Safe to re-run: ON CONFLICT skips the insert if the email already
-- exists.
-- ============================================================

INSERT INTO users (name, email, password_hash, role)
VALUES (
    'Admin',
    'admin@example.com',
    '$2a$10$s32msu0u9XA1O2GZWzNs9OHC93035AxjRqokk3GfBpXQGH.Bo4/z.',
    'ADMIN'
)
ON CONFLICT (email) DO NOTHING;
