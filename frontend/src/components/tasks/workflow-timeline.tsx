import { useEffect, useState } from "react";
import { GitCommitHorizontal } from "lucide-react";

import { getApiErrorMessage } from "@/lib/api-client";
import { tasksApi } from "@/lib/tasks-api";
import type { WorkflowEvent } from "@/lib/types";

const formatTime = (isoDate: string): string => {
  try {
    return new Date(isoDate).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return isoDate;
  }
};

export const WorkflowTimeline = ({ taskId }: { taskId: string }) => {
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await tasksApi.listWorkflows(taskId);
        if (!cancelled) setEvents(data);
      } catch (loadError) {
        if (!cancelled) setError(getApiErrorMessage(loadError, "Could not load activity."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    // This timeline is populated asynchronously via Kafka events from
    // other services (uploads, etc.), so poll for updates.
    const intervalId = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [taskId]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading activity...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="flex gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary">
            <GitCommitHorizontal className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1 border-b pb-3">
            <p className="text-sm font-medium">{event.message}</p>
            <p className="text-xs text-muted-foreground">
              {event.eventType} · {formatTime(event.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
