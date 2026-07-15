// Single source of truth for the automations list.
//
// `factors` is fully modeled from its n8n JSON. The other five are inferred
// from the filenames you shared and marked `ready: false` — we fill in each
// one's real config as we build its tool page (or as you share its JSON).

export type TriggerType = "notion" | "sheets" | "webhook" | "schedule" | "voice";
export type ToolIcon = "photo" | "file-text" | "video" | "mic";

export interface Automation {
  slug: string;
  name: string;
  description: string;
  icon: ToolIcon;
  triggers: TriggerType[];
  integrations: string[];
  status: "enabled" | "draft";
  ready: boolean; // true = has a real tool page; false = placeholder
  locked?: boolean; // your "DO NOT TOUCH" workflows — reference only
  runsToday?: number;
  successRate?: number;
}

export const TRIGGER_LABEL: Record<TriggerType, string> = {
  notion: "Notion",
  sheets: "Sheets",
  webhook: "Webhook",
  schedule: "Schedule",
  voice: "Voice",
};

export const AUTOMATIONS: Automation[] = [
  {
    slug: "factors",
    name: "Factors — branded social image",
    description:
      "Reads Notion pages and renders branded PNG social images from the page fields.",
    icon: "photo",
    triggers: ["notion", "schedule"],
    integrations: ["Notion", "Browserless", "Cloudflare"],
    status: "enabled",
    ready: true,
    runsToday: 24,
    successRate: 96,
  },
  {
    slug: "linkedin-pulse",
    name: "LinkedIn Pulse — blog generator",
    description:
      "Turns Sheet rows into blog posts, drafted with Claude and published to Webflow and Notion.",
    icon: "file-text",
    triggers: ["sheets"],
    integrations: ["Sheets", "Claude", "Webflow", "Notion"],
    status: "draft",
    ready: false,
  },
  {
    slug: "vrushti-blog",
    name: "Blog content generator",
    description:
      "Sheet-driven blog content written with Claude, saved to Drive and delivered to Slack.",
    icon: "file-text",
    triggers: ["sheets"],
    integrations: ["Sheets", "Claude", "Drive", "Slack"],
    status: "draft",
    ready: false,
    locked: true,
  },
  {
    slug: "voice-blog",
    name: "Voice → Blog",
    description: "Converts a voice recording into a structured blog draft.",
    icon: "mic",
    triggers: ["webhook"],
    integrations: ["Claude"],
    status: "draft",
    ready: false,
  },
  {
    slug: "blog-videos",
    name: "Blog → Videos",
    description: "Generates short videos from published blog content.",
    icon: "video",
    triggers: ["webhook"],
    integrations: ["Claude"],
    status: "draft",
    ready: false,
  },
  {
    slug: "blog-video",
    name: "Blog ↔ Video",
    description: "Two-way conversion between blog posts and video scripts.",
    icon: "video",
    triggers: ["webhook"],
    integrations: ["Claude"],
    status: "draft",
    ready: false,
    locked: true,
  },
];

export function getAutomation(slug: string): Automation | undefined {
  return AUTOMATIONS.find((a) => a.slug === slug);
}
