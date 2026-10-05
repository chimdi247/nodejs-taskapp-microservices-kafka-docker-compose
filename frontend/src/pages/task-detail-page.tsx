import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Navbar } from "@/components/layout/navbar";
import { AttachmentsPanel } from "@/components/tasks/attachments-panel";
import { StatusBadge } from "@/components/tasks/status-badge";
import { WorkflowTimeline } from "@/components/tasks/workflow-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getApiErrorMessage } from "@/lib/api-client";
import { tasksApi } from "@/lib/tasks-api";
import type { Task } from "@/lib/types";

const formatDate = (isoDate: string): string => {
  try {
    return new Date(isoDate).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return isoDate;
  }
};

export const TaskDetailPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    tasksApi
      .get(taskId)
      .then(setTask)
      .catch((loadError) => setError(getApiErrorMessage(loadError, "Could not load this task.")))
      .finally(() => setIsLoading(false));
  }, [taskId]);

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <main className="container max-w-3xl py-8">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/tasks")}>
          <ArrowLeft className="h-4 w-4" />
          Back to tasks
        </Button>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading task...</p>
        ) : error || !task ? (
          <p className="text-sm text-destructive">{error ?? "Task not found."}</p>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-xl">{task.title}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Created {formatDate(task.createdAt)} · Updated {formatDate(task.updatedAt)}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </CardHeader>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <AttachmentsPanel taskId={task.id} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-3 text-sm font-semibold">Activity</h3>
                <Separator className="mb-4" />
                <WorkflowTimeline taskId={task.id} />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};
