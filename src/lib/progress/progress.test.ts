import { describe, expect, it } from "vitest";
import { getDueCardIds, getStudyStats, readProgressMap, writeProgressMap } from "./progress";
import type { CardProgress } from "@/lib/scheduler/scheduler";

const today = new Date("2026-06-16T08:00:00.000Z");

const progress: Record<string, CardProgress> = {
  dueKnown: {
    status: "known",
    ease: 2.65,
    intervalDays: 3,
    dueAt: "2026-06-16T00:00:00.000Z",
    lastReviewedAt: "2026-06-16T01:00:00.000Z",
    reviewCount: 2,
    knownCount: 2,
    fuzzyCount: 0,
    unknownCount: 0,
  },
  futureLearning: {
    status: "learning",
    ease: 2.4,
    intervalDays: 1,
    dueAt: "2026-06-17T00:00:00.000Z",
    lastReviewedAt: "2026-06-15T01:00:00.000Z",
    reviewCount: 1,
    knownCount: 0,
    fuzzyCount: 1,
    unknownCount: 0,
  },
};

describe("progress helpers", () => {
  it("finds cards due at or before the current time", () => {
    expect(getDueCardIds(progress, today)).toEqual(["dueKnown"]);
  });

  it("computes daily study stats", () => {
    expect(getStudyStats(progress, today)).toEqual({
      dueCount: 1,
      learnedToday: 1,
      knownRate: 50,
      totalReviewed: 2,
    });
  });

  it("computes stats for a selected card set only", () => {
    expect(getStudyStats(progress, today, ["futureLearning"])).toEqual({
      dueCount: 0,
      learnedToday: 0,
      knownRate: 0,
      totalReviewed: 1,
    });
  });

  it("serializes and restores progress maps", () => {
    const serialized = writeProgressMap(progress);
    expect(readProgressMap(serialized)).toEqual(progress);
    expect(readProgressMap("not json")).toEqual({});
  });
});
