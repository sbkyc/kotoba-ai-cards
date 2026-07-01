import { describe, expect, it } from "vitest";
import { getInstallPlatform, getInstallSteps, isStandaloneDisplay } from "./install";

describe("pwa install helpers", () => {
  it("detects iOS Safari style browsers from the user agent", () => {
    expect(getInstallPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1")).toBe("ios");
  });

  it("detects Android browsers from the user agent", () => {
    expect(getInstallPlatform("Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36")).toBe("android");
  });

  it("returns platform-specific install steps", () => {
    expect(getInstallSteps("ios")[0]).toContain("Safari");
    expect(getInstallSteps("android")[0]).toContain("Chrome");
    expect(getInstallSteps("desktop")[0]).toContain("地址栏");
  });

  it("reads standalone display mode from media query and navigator", () => {
    expect(isStandaloneDisplay(true, false)).toBe(true);
    expect(isStandaloneDisplay(false, true)).toBe(true);
    expect(isStandaloneDisplay(false, false)).toBe(false);
  });
});
