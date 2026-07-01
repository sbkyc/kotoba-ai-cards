import { describe, expect, it } from "vitest";
import { previewReview, scheduleReview } from "./scheduler";

const now = new Date("2026-06-16T00:00:00.000Z");

describe("scheduleReview", () => {
  it("moves a new card to known with a longer interval when marked known", () => {
    const result = scheduleReview(undefined, "known", now);

    expect(result.status).toBe("known");
    expect(result.intervalDays).toBe(3);
    expect(result.knownCount).toBe(1);
    expect(result.reviewCount).toBe(1);
    expect(result.dueAt).toBe("2026-06-19T00:00:00.000Z");
  });

  it("keeps a fuzzy card in learning with a short interval", () => {
    const result = scheduleReview(undefined, "fuzzy", now);

    expect(result.status).toBe("learning");
    expect(result.intervalDays).toBe(1);
    expect(result.fuzzyCount).toBe(1);
    expect(result.dueAt).toBe("2026-06-17T00:00:00.000Z");
  });

  it("resets an unknown card to near-term review", () => {
    const result = scheduleReview(undefined, "unknown", now);

    expect(result.status).toBe("learning");
    expect(result.intervalDays).toBe(0);
    expect(result.unknownCount).toBe(1);
    expect(result.dueAt).toBe("2026-06-16T00:00:00.000Z");
  });
});

describe("previewReview", () => {
  it("returns readable next-review labels without mutating progress", () => {
    const previous = scheduleReview(undefined, "fuzzy", now);
    const snapshot = { ...previous };

    expect(previewReview(previous, "known", now)).toEqual({
      intervalDays: 3,
      dueAt: "2026-06-19T00:00:00.000Z",
      label: "3天后",
    });
    expect(previous).toEqual(snapshot);
  });
});
