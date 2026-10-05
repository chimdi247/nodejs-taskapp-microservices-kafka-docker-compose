# Single Dockerfile for every Node service in this monorepo
# (api-gateway, auth-service, task-service, media-service,
# workflow-service), selected via the SERVICE build arg -- see each
# service's block in docker-compose.yml.
#
# This project runs every service directly via `tsx` (no separate
# build/compile step -- see each app's package.json "start" script),
# so the image just installs dependencies (workspace-hoisted, so
# "shared" resolves correctly for every app) and runs tsx directly.
FROM node:22-alpine AS base

WORKDIR /app

# Install once, for every workspace, so npm can hoist shared deps and
# symlink the "shared" package correctly for every app.
COPY package.json package-lock.json ./
COPY apps/api-gateway/package.json apps/api-gateway/package.json
COPY apps/auth-service/package.json apps/auth-service/package.json
COPY apps/task-service/package.json apps/task-service/package.json
COPY apps/media-service/package.json apps/media-service/package.json
COPY apps/workflow-service/package.json apps/workflow-service/package.json
COPY packages/shared/package.json packages/shared/package.json

# Every service's "start" script runs through tsx directly (there's no
# compiled dist/ output in this project), so devDependencies (tsx,
# typescript, @types/*) are genuinely needed at runtime here, not just
# for local development -- this is NOT --omit=dev.
RUN npm install

COPY . .

ARG SERVICE
ENV SERVICE=${SERVICE}
WORKDIR /app/apps/${SERVICE}

# OpenTelemetry zero-code auto-instrumentation: NODE_OPTIONS applies
# to the Node process regardless of it being launched via tsx, so this
# works without changing any app entrypoint. Fully configured through
# OTEL_* environment variables in docker-compose.yml -- no source
# changes. See observability/README.md.
ENV NODE_OPTIONS="--require @opentelemetry/auto-instrumentations-node/register"

CMD ["npx", "tsx", "src/index.ts"]
