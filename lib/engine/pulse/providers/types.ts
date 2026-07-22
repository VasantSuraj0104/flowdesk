// A provider takes a system + user prompt and returns article Markdown.
// Every model-specific detail (endpoint, auth header, request/response shape)
// lives behind this interface, so the generate route never knows or cares which
// model actually wrote the article. Adding a provider = one new file here.

export interface GenerateArgs {
  system: string;
  user: string;
  maxTokens: number;
}

export interface ProviderResult {
  markdown: string;
  model: string;
  usage?: unknown;
}

export interface Provider {
  id: string;
  /** Human label for the UI / provenance line. */
  label: string;
  /** Whether the required API key is present in env. */
  configured(): boolean;
  generate(args: GenerateArgs): Promise<ProviderResult>;
}

export class ProviderError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ProviderError";
  }
}
