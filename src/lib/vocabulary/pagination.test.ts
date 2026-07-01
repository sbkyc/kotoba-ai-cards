import { describe, expect, it } from "vitest";
import { getVisibleVocabulary } from "./pagination";

const items = Array.from({ length: 10 }, (_, index) => ({ id: `card-${index + 1}` }));

describe("getVisibleVocabulary", () => {
  it("returns the current visible slice and load-more state", () => {
    const result = getVisibleVocabulary(items, 4);

    expect(result.visibleItems.map((item) => item.id)).toEqual(["card-1", "card-2", "card-3", "card-4"]);
    expect(result.visibleCount).toBe(4);
    expect(result.totalCount).toBe(10);
    expect(result.hasMore).toBe(true);
  });

  it("caps the visible count at the result size", () => {
    const result = getVisibleVocabulary(items, 20);

    expect(result.visibleItems).toHaveLength(10);
    expect(result.visibleCount).toBe(10);
    expect(result.hasMore).toBe(false);
  });
});
