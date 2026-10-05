import { type MouseEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";

import { Navbar } from "@/components/layout/navbar";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { StatusBadge } from "@/components/tasks/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { getApiErrorMessage } from "@/lib/api-client";
import { tasksApi } from "@/lib/tasks-api";
import type { Task } from "@/lib/types";

const formatDate = (isoDate: string): string => {
  try {
    return new Date(isoDate).toLocaleDateString([], { dateStyle: "medium" });
  } catch {
    return isoDate;
  }
};

export const TasksPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await tasksApi.list();
      setTasks(data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load tasks."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (title: string) => {
    const task = await tasksApi.create(title);
    setTasks((current) => [task, ...current]);
  };

  const handleDelete = async (event: MouseEvent, taskId: string) => {
    event.stopPropagation();
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    try {
      await tasksApi.remove(taskId);
      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Could not delete the task."));
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <main className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
            <p className="text-sm text-muted-foreground">Track and manage support tasks.</p>
          </div>
          <NewTaskDialog onCreate={handleCreate} />
        </div>

        {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
              <p>No tasks yet. Create your first one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {tasks.map((task) => (
              <Card
                key={task.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/tasks/${task.id}`)}
              >
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">Created {formatDate(task.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={task.status} />
                    {user?.role === "ADMIN" ? (
                      <Button size="icon" variant="ghost" onClick={(event) => handleDelete(event, task.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
