# observability/

Config and provisioning for the monitoring stack in `docker-compose.yml`:
OpenTelemetry Collector, Prometheus, Alertmanager, Grafana, Loki, Promtail,
and Jaeger.

## How telemetry flows

```text
api-gateway, auth-service, task-service, ---- OTLP traces --------> otel-collector --> Jaeger
media-service, workflow-service          \
  (NODE_OPTIONS=--require                 ---- :9464/metrics -------------------------> scraped by Prometheus directly (per service)
   @opentelemetry/auto-instrumentations-node/register,
   zero code changes -- see root Dockerfile)

db / kafka / every service (containers) --> cAdvisor -----------------------------------> scraped by Prometheus
host --------------------------------------> node-exporter -----------------------------> scraped by Prometheus

every container's stdout ------------------> Promtail (via Docker socket) --------------> Loki

Prometheus -- alert rules (alerts.yml) --> Alertmanager --> email
Prometheus, Loki, Jaeger  ---- all three added as Grafana datasources, cross-linked
                               (trace -> logs, trace -> metrics)
```

- **Traces & auto-instrumented metrics**: every one of the five Node
  services (api-gateway, auth-service, task-service, media-service,
  workflow-service) is instrumented purely through the shared root
  `Dockerfile`'s `NODE_OPTIONS="--require @opentelemetry/auto-instrumentations-node/register"`
  -- this patches Express, the `http`/`https` modules, and the `pg` client
  automatically at process startup, with **zero source changes** to any
  route/controller. Traces export via OTLP to `otel-collector`, which
  forwards them to Jaeger (Jaeger has accepted OTLP natively since 1.35,
  so no separate jaeger-thrift exporter is needed). Metrics use the
  standard `OTEL_METRICS_EXPORTER=prometheus` env var, which makes each
  service self-host its own `/metrics` endpoint on `:9464` -- scraped by
  Prometheus directly (one job per service in
  `observability/prometheus/prometheus.yml`), giving a real
  `up{job="<service>"}` per service rather than one aggregate signal.

- **Business KPI (total users)**: `apps/auth-service/src/otel/business-metrics.ts`
  adds one custom metric, `app_users_total` -- an OpenTelemetry
  **observable gauge** whose callback runs `SELECT COUNT(*) FROM users`
  each time Prometheus scrapes auth-service, registered in
  `apps/auth-service/src/index.ts`. It uses the global
  `@opentelemetry/api`, so it's a safe no-op if the SDK isn't running.

- **Container/node metrics**: `cadvisor` (container CPU/memory/network) and
  `node-exporter` (host CPU/memory/disk), scraped directly.

- **Logs**: `promtail` uses Docker service discovery (`docker_sd_configs`,
  via a read-only mount of the Docker socket) to tail **every** container's
  stdout/stderr into Loki -- all five Node services (pino HTTP logs),
  the frontend (nginx's structured JSON access log, see
  `frontend/nginx.conf`), and every infra container.

### A metric-name caveat worth knowing

The HTTP request metric names used in the dashboard/alerts
(`http_server_duration_milliseconds_count`/`_bucket`) match
`@opentelemetry/instrumentation-http`'s naming at the time this was put
together. OpenTelemetry's JS semantic conventions for HTTP metrics have
changed across versions. **If the "HTTP Traffic & Latency" panels come up
empty**, open Prometheus (http://localhost:9091) -> Graph, search for
`http_server`, and adjust the metric name in
`observability/grafana/provisioning/dashboards/nodems-overview.json`
accordingly. `app_users_total` and the container/node panels aren't
affected -- those names are exact, since this repo's own code (or
cAdvisor/node-exporter, both stable/well-known) defines them.

### Why the frontend has no OpenTelemetry SDK

The backend services get true zero-code auto-instrumentation via
`NODE_OPTIONS` because they're long-running Node processes. The React
frontend is a Vite static SPA with no server-side runtime -- bundling the
OpenTelemetry Web SDK into the build was intentionally left out, the same
call made for the other example projects built this way: it couldn't be
verified without actually running the build, and a broken frontend build
would be far worse than skipping browser-side tracing. Frontend request
activity is visible through its structured nginx access logs in Loki, and
cAdvisor covers its container-level CPU/memory like every other container.

## Grafana

- URL: http://localhost:3001 (or `${GRAFANA_PORT}`)
- Login: `admin` / `admin` (`GF_ADMIN_USER` / `GF_ADMIN_PASSWORD` in `.env`)
- Datasources (Prometheus, Loki, Jaeger) and the dashboard below are
  provisioned automatically on first boot from
  `observability/grafana/provisioning/`.

### Dashboard

"Node Microservices - Service Overview" (`nodems-overview.json`), in the
"Node Microservices" folder, 19 panels across five rows:

- **Service Health & Uptime**: a table of every scrape target's up/down status
- **HTTP Traffic & Latency (SLIs)**: total request rate, error rate, P95
  latency, availability SLI, request rate by service, p95 latency by
  service, error rate % by service over time
- **Business KPIs**: total registered users (current value + over time),
  sourced from `app_users_total`
- **Container Resource Utilization**: CPU % and memory per container
- **Node Resource Utilization**: host CPU % and memory %

### Alerting -- via Alertmanager (not Grafana-managed alerts)

Unlike the other example projects in this series, this one uses
**Prometheus + Alertmanager** for alerting, as requested, rather than
Grafana's own unified alerting:

- `observability/prometheus/alerts.yml` defines the rules (mounted into
  `prometheus` and referenced via its `rule_files` config), evaluated by
  Prometheus itself:
  - `ContainerCPUHigh` / `ContainerMemoryHigh` (> 70%, 5m sustained)
  - `NodeCPUHigh` / `NodeMemoryHigh` (> 70%, 5m sustained)
  - `ServiceDown` (any of the five Node services unreachable for 2m)
- `observability/alertmanager/alertmanager.yml` handles routing/grouping
  and email delivery, with an inhibition rule so a `ServiceDown` firing
  suppresses the noisier warning-level container alerts for the same
  instance.
- Alertmanager UI: http://localhost:9093

**Important:** Alertmanager's config file does **not** support `${VAR}`
environment-variable interpolation the way Grafana's provisioning files
do. The SMTP/email settings in `alertmanager.yml` are literal placeholder
values -- edit that file directly (then
`docker compose restart alertmanager`) to point at real SMTP credentials,
not `.env`.

**Why "% of limit" for container memory**: `container_spec_memory_limit_bytes`
(from cAdvisor) is a huge sentinel value for containers with no memory cap,
which would make a raw usage-based percentage meaningless. So
`docker-compose.yml` sets `deploy.resources.limits.memory` on every
application/data-store service (honored by plain `docker compose up` in
Compose v2, not just Swarm) specifically so this alert has a real
denominator.

## Known platform caveats

- **cAdvisor** runs `privileged: true` with the standard host mounts for
  the most reliable cross-platform metrics collection; on Docker Desktop
  (macOS/Windows) some disk-level metrics may still be unavailable since
  it's running inside a Linux VM, but container CPU/memory metrics work
  normally.
- **node-exporter** is run with bind-mounted `/proc`, `/sys`, `/` (not
  `network_mode: host`, which doesn't work on Docker Desktop) so it starts
  consistently everywhere; on Docker Desktop this reports the VM's
  resources, not literally the physical host's.
