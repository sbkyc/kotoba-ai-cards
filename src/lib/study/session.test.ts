import { describe, expect, it } from "vitest";
import { getNextQueueIndexAfterRating, recordSessionRating } from "./session";

describe("getNextQueueIndexAfterRating", () => {
  it("resets to the first card because the queue is rebuilt after every rating", () => {
    expect(getNextQueueIndexAfterRating({ previousIndex: 0, nextQueueLength: 3 })).toBe(0);
    expect(getNextQueueIndexAfterRating({ previousIndex: 2, nextQueueLength: 5 })).toBe(0);
  });

  it("keeps index at zero when the next queue is empty", () => {
    expect(getNextQueueIndexAfterRating({ previousIndex: 2, nextQueueLength: 0 })).toBe(0);
  });
});

describe("recordSessionRating", () => {
  it("increments completed count and rating bucket", () => {
    expect(recordSessionRating({ completed: 1, known: 1, fuzzy: 0, unknown: 0 }, "fuzzy")).toEqual({
      completed: 2,
      known: 1,
      fuzzy: 1,
      unknown: 0,
    });
  });
});
