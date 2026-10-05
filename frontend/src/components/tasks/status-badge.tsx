import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/types";

const STATUS_VARIANT: Record<Task["status"], "secondary" | "default" | "success" | "outline"> = {
  OPEN: "secondary",
  IN_PROGRESS: "default",
  RESOLVED: "success",
  CLOSED: "outline",
};

export const StatusBadge = ({ status }: { status: Task["status"] }) => (
  <Badge variant={STATUS_VARIANT[status]}>{status.replace("_", " ")}</Badge>
);
