import { apiClient } from "@/lib/api-client";
import type { Attachment, Task, WorkflowEvent } from "@/lib/types";

export const tasksApi = {
  async list(): Promise<Task[]> {
    const response = await apiClient.get<{ data: { tasks: Task[] } }>("/tasks");
    return response.data.data.tasks;
  },

  async get(id: string): Promise<Task> {
    const response = await apiClient.get<{ data: { task: Task } }>(`/tasks/${id}`);
    return response.data.data.task;
  },

  async create(title: string): Promise<Task> {
    const response = await apiClient.post<{ data: { task: Task } }>("/tasks", { title });
    return response.data.data.task;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  async listAttachments(taskId: string): Promise<Attachment[]> {
    const response = await apiClient.get<{ data: { extractAttachments: Attachment[] } }>(
      `/tasks/${taskId}/attachments`,
    );
    return response.data.data.extractAttachments;
  },

  async uploadAttachment(taskId: string, file: File): Promise<Attachment> {
    const formData = new FormData();
    formData.append("image", file);
    const response = await apiClient.post<{ data: { attachment: Attachment } }>(
      `/tasks/${taskId}/attachments`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data.attachment;
  },

  async listWorkflows(taskId: string): Promise<WorkflowEvent[]> {
    const response = await apiClient.get<{ data: { workflows: WorkflowEvent[] } }>(
      `/tasks/${taskId}/workflows`,
    );
    return response.data.data.workflows;
  },
};
