import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-client";
import { tasksApi } from "@/lib/tasks-api";
import type { Attachment } from "@/lib/types";

export const AttachmentsPanel = ({ taskId }: { taskId: string }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const data = await tasksApi.listAttachments(taskId);
      setAttachments(data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load attachments."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const uploaded = await tasksApi.uploadAttachment(taskId, file);
      setAttachments((current) => [uploaded, ...current]);
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, "Upload failed."));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Attachments</h3>
        <Button
          size="sm"
          variant="outline"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          Upload image
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading attachments...</p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attachments yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {attachments.map((attachment) => (
            <a
              key={attachment.id}
              href={attachment.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-md border"
            >
              <img
                src={attachment.imageUrl}
                alt="Task attachment"
                className="h-24 w-full object-cover transition-transform hover:scale-105"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
