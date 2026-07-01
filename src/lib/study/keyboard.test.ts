import { describe, expect, it } from "vitest";
import { mapStudyKey } from "./keyboard";

describe("mapStudyKey", () => {
  it("maps reveal, ratings, and favorite shortcuts", () => {
    expect(mapStudyKey(" ", false)).toBe("reveal");
    expect(mapStudyKey("1", false)).toBe("unknown");
    expect(mapStudyKey("2", false)).toBe("fuzzy");
    expect(mapStudyKey("3", false)).toBe("known");
    expect(mapStudyKey("1", true)).toBe("unknown");
    expect(mapStudyKey("2", true)).toBe("fuzzy");
    expect(mapStudyKey("3", true)).toBe("known");
    expect(mapStudyKey("f", false)).toBe("favorite");
  });

  it("ignores unrelated keys", () => {
    expect(mapStudyKey("x", true)).toBeNull();
  });
});
