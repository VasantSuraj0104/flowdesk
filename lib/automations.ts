// Single source of truth for the automations list.
//
// All entries are placeholders (`ready: false`) until each tool page is built
// or its workflow JSON is shared.

export type ToolIcon = "photo" | "file-text" | "video" | "mic";

export interface Automation {
  slug: string;
  name: string;
  description: string;
  icon: ToolIcon;
  integrations: string[];
  status: "enabled" | "draft";
  ready: boolean; // true = has a real tool page; false = placeholder
  locked?: boolean; // your "DO NOT TOUCH" workflows — reference only
  runsToday?: number;
  successRate?: number;
  /** One identity colour so the monochrome list still tells tools apart. */
  accent?: string;
}

export const AUTOMATIONS: Automation[] = [
  {
    slug: "linkedin-pulse",
    name: "LinkedIn Pulse — blog generator",
    description:
      "Turns Sheet rows into blog posts, drafted with Claude and published to Webflow and Notion.",
    icon: "file-text",
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
    integrations: ["Claude"],
    status: "draft",
    ready: false,
  },
  {
    slug: "blog-videos",
    name: "Blog → Videos",
    description: "Generates short videos from published blog content.",
    icon: "video",
    integrations: ["Claude"],
    status: "draft",
    ready: false,
  },
  {
    slug: "blog-video",
    name: "Blog ↔ Video",
    description: "Two-way conversion between blog posts and video scripts.",
    icon: "video",
    integrations: ["Claude"],
    status: "draft",
    ready: false,
    locked: true,
  },
];

export function getAutomation(slug: string): Automation | undefined {
  return AUTOMATIONS.find((a) => a.slug === slug);
}
