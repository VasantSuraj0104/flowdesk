// Run statuses mirror the n8n execution states written to the `runs` table.
// Colors are semantic and fixed everywhere in the app.
export type RunStatus = "success" | "running" | "failed" | "queued";

export const STATUS_META: Record<
  RunStatus,
  { label: string; color: string; text: string }
> = {
  success: { label: "Success", color: "#3DE7DF", text: "text-accent" },
  running: { label: "Running", color: "#63D8FF", text: "text-primary" },
  failed: { label: "Failed", color: "#FF6B6B", text: "text-danger" },
  queued: { label: "Queued", color: "#8A9099", text: "text-text-muted" },
};
