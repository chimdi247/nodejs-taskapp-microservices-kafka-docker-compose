# docker/

Supporting files for `docker compose up`, referenced from the root
`docker-compose.yml`.

## init-db/

Mounted into the `db` (PostgreSQL) container's `/docker-entrypoint-initdb.d`.
The official postgres image runs every `*.sql` file it finds there, in
alphabetical order, **once** -- only when the container starts against
a brand-new (empty) data volume.

| File | Purpose |
|---|---|
| `01-schema.sql` | Creates every table -- this is the project's own `sql/001..004_*.sql` files, concatenated in order (those still exist and remain the source of truth for individual migrations via `npm run db:migrate`). |
| `02-seed-admin-user.sql` | Seeds a login: `admin@example.com` / `password123`, `role=ADMIN`. |

The password hash is a real bcrypt hash (`$2a$`, cost 10) matching
`auth-service`'s own `bcrypt.hash(password, 10)` call exactly --
pre-computed offline since plain SQL can't run bcrypt itself. It
verifies through `POST /auth/login` exactly like a hash the app
generated itself.

### Resetting the database

These scripts only run once. If you've already started the stack
before (so the `db` volume already exists), editing the `.sql` files
won't do anything until you drop that volume:

```bash
docker compose down -v
docker compose up --build
```

## Corrections made while wiring this up

A few real bugs were found and fixed in the app code itself (not just
Docker plumbing) -- see the diffs for full context:

- `apps/media-service/src/services/media.services.ts`: `uploadAttachment`
  called `assertTaskAccess(input.taskId, input.taskId, input.role)` --
  passing `taskId` twice instead of `userId` -- which broke the
  ownership check for every non-admin upload (a task's actual owner
  could never match, since a task ID never equals a user ID).
- `apps/media-service/src/utils/stroage.ts`: `endpoint.slice(0, 1)`
  (keeping only the endpoint's first character) instead of
  `slice(0, -1)` (stripping a trailing slash) when building the
  returned `imageUrl`.
- `packages/shared/src/kafka/client.ts`: `.filter(boolean)` was
  importing and using zod's `boolean` schema-builder function as a
  filter predicate, not the intended truthy-filter -- fixed to the
  built-in `Boolean`.
- The `AWS_ACCESS_KEY_ID` environment variable was read by
  `media-service` but never defined anywhere in `.env` -- image
  uploads could never have worked. `.env` now sets it (and wires
  media-service to a bundled MinIO container as a local S3-compatible
  store, so uploads work out of the box -- see the `minio` service in
  `docker-compose.yml`).
