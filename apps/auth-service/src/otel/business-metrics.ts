// Business KPI metrics for auth-service, on top of the auto-instrumented
// technical metrics (HTTP/pg spans+metrics come for free from
// `@opentelemetry/auto-instrumentations-node/register` -- see the root
// Dockerfile's NODE_OPTIONS and observability/README.md).
//
// Uses the global OpenTelemetry API, so it's a safe no-op if the SDK
// isn't initialized (e.g. running locally without NODE_OPTIONS set) --
// no conditional wiring needed at the call site.
import { metrics } from "@opentelemetry/api";
import { getPool } from "shared";

const meter = metrics.getMeter("auth-service-business-metrics");

// An observable (pull-based) gauge: its callback runs each time
// Prometheus scrapes /metrics, so it always reflects the current row
// count rather than needing every register/login call to bump a
// counter by hand.
export function registerUserCountMetric() {
  const totalUsersGauge = meter.createObservableGauge("app_users_total", {
    description: "Total number of registered users",
  });

  totalUsersGauge.addCallback(async (observableResult) => {
    try {
      const result = await getPool().query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM users",
      );
      observableResult.observe(Number(result.rows[0]?.count ?? 0));
    } catch {
      // If the DB isn't reachable when a scrape happens, just skip
      // this observation rather than throwing inside the callback.
    }
  });
}
