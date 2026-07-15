import { parseRenderJob, ParseInput } from "./parse";
import { renderPng, uploadPng, EngineError, Step } from "./steps";

export interface RunResult {
  ok: true;
  url: string;
  imgKey: string;
  template: string;
  variant: string;
  width: number;
  height: number;
  renderUrl: string;
  timings: Record<string, number>;
}

export interface RunFailure {
  ok: false;
  step: Step | "parse";
  error: string;
  detail?: string;
  timings: Record<string, number>;
}

/**
 * The whole Factors engine: parse → render → upload.
 * Replaces the n8n webhook chain for manual runs.
 */
export async function runFactors(
  input: ParseInput
): Promise<RunResult | RunFailure> {
  const timings: Record<string, number> = {};
  const t0 = Date.now();

  try {
    const job = parseRenderJob(input);
    timings.parse = Date.now() - t0;

    const tRender = Date.now();
    const png = await renderPng(job.browserless);
    timings.render = Date.now() - tRender;

    const tUpload = Date.now();
    const url = await uploadPng(png, job.imgKey);
    timings.upload = Date.now() - tUpload;

    timings.total = Date.now() - t0;

    return {
      ok: true,
      url,
      imgKey: job.imgKey,
      template: job.template,
      variant: job.variant,
      width: job.w,
      height: job.h,
      renderUrl: job.renderUrl,
      timings,
    };
  } catch (err) {
    timings.total = Date.now() - t0;

    if (err instanceof EngineError) {
      return {
        ok: false,
        step: err.step,
        error: err.message,
        detail: err.detail,
        timings,
      };
    }
    return {
      ok: false,
      step: "parse",
      error: err instanceof Error ? err.message : "Unknown error.",
      timings,
    };
  }
}
