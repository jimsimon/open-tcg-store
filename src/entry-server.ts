import { render as ssrRender } from "@lit-labs/ssr";
import { collectResult } from "@lit-labs/ssr/lib/render-result.js";
import type { TemplateResult } from "lit";

export function render(template: TemplateResult) {
  return collectResult(ssrRender(template));
}
