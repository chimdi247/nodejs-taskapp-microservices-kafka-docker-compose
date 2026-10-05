# Node Microservices

A task-tracking app built as a Node.js microservices monorepo: an API
gateway fronting four backend services (auth, task, media, workflow),
a React (Vite/shadcn-style) frontend, PostgreSQL, and Kafka for
inter-service events. Customers/agents create tasks, attach images,
and see an activity timeline built from Kafka events; admins can
delete tasks.

## Running everything with Docker Compose

The whole stack -- Postgres, Kafka (+ Kafka UI), MinIO (local
S3-compatible storage), all five Node services, the React frontend,
and a full observability stack (Prometheus, Alertmanager, Grafana,
Loki, Promtail, Jaeger, cAdvisor, node-exporter) -- starts with:

```bash
docker compose up --build
```

A ready-to-use `.env` (with generated dev secrets) is already included,
so this works with no setup. First boot also creates all the database
tables and seeds a default login automatically -- see
[docker/README.md](docker/README.md).

Once everything is healthy:

| What | URL | Login |
|---|---|---|
| App (frontend) | http://localhost:5173 | `admin@example.com` / `password123` |
| API gateway | http://localhost:3000 | -- |
| Grafana | http://localhost:3001 | `admin` / `admin` |
| Prometheus | http://localhost:9091 | -- |
| Alertmanager | http://localhost:9093 | -- |
| Jaeger UI | http://localhost:16686 | -- |
| Kafka UI | http://localhost:8080 | -- |
| MinIO console | http://localhost:9001 | `minioadmin` / `minioadmin123` |

See [observability/README.md](observability/README.md) for how telemetry
flows from every service to Grafana, what the provisioned dashboard
covers, and how Alertmanager is wired up. See
[docker/README.md](docker/README.md) for a list of real bugs found and
fixed while wiring this up.

Tear down with `docker compose down`, or `docker compose down -v` to
also wipe every database/queue/metrics volume (needed if you edit the
SQL init scripts, since they only run against a fresh volume).

## Repository Layout

```text
apps/
  api-gateway/       Routes/proxies requests to the four services below, JWT verification, RBAC
  auth-service/       Registration, login, user profiles
  task-service/       Task CRUD
  media-service/      Task image attachments (S3-compatible storage)
  workflow-service/   Kafka consumer building an activity timeline from task/media events
packages/shared/      Shared DB pool, Kafka client, logger, error handling, auth middleware
frontend/              React (Vite) + shadcn-style UI
docker/                Root docker-compose.yml's Postgres init SQL (schema + admin seed)
observability/         Root docker-compose.yml's Prometheus/Alertmanager/Loki/Jaeger/Grafana/otel-collector config
sql/                    The individual migration files docker/init-db/01-schema.sql bundles
```

## Manual / local development

Prerequisites: Node.js 20+, PostgreSQL and Kafka running locally.

```bash
npm install                 # installs every workspace
npm run db:migrate          # runs sql/*.sql against DATABASE_URL
npm run dev                 # runs every service concurrently (see root package.json)
```

Each service reads its own `PORT`/`DATABASE_URL`/etc. from `.env` at
the repo root (or the service's own `.env`, checked first) -- see
`.env`'s comments for the full list.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Available at `http://localhost:5173`, talking to `VITE_API_BASE_URL`
(defaults to `http://localhost:3000` if unset).

## Tech Stack

| Area | Main tools |
|---|---|
| Backend | Node.js, Express, TypeScript (via `tsx`, no build step), npm workspaces |
| Frontend | React, Vite, TypeScript, shadcn-style components, Tailwind CSS |
| Database | PostgreSQL |
| Messaging | Kafka |
| Object storage | S3-compatible (MinIO locally) |
| Observability | OpenTelemetry, Prometheus, Alertmanager, Grafana, Loki, Jaeger |
| Infrastructure | Docker Compose |
