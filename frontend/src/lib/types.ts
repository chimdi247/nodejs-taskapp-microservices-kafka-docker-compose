export type UserRole = "USER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  imageUrl: string;
  publicId: string;
  uploadedBy: string;
  createdAt: string;
}

export interface WorkflowEvent {
  id: string;
  taskId: string;
  message: string;
  createdBy: string;
  eventType: string;
  createdAt: string;
}
