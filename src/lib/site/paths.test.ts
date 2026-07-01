import { describe, expect, it } from "vitest";
import { normalizeBasePath, withBasePath } from "./paths";

describe("site paths", () => {
  it("normalizes empty and slash base paths for root deployments", () => {
    expect(normalizeBasePath("")).toBe("");
    expect(normalizeBasePath("/")).toBe("");
  });

  it("normalizes repository subpaths without trailing slashes", () => {
    expect(normalizeBasePath("kotoba-ai-cards/")).toBe("/kotoba-ai-cards");
    expect(normalizeBasePath("/kotoba-ai-cards/")).toBe("/kotoba-ai-cards");
  });

  it("prefixes absolute app paths with the deployment base path", () => {
    expect(withBasePath("/manifest.webmanifest", "/kotoba-ai-cards")).toBe("/kotoba-ai-cards/manifest.webmanifest");
    expect(withBasePath("/", "/kotoba-ai-cards")).toBe("/kotoba-ai-cards/");
  });
});
