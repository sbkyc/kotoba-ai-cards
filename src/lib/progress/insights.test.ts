import { describe, expect, it } from "vitest";
import type { PracticeSessionSummary } from "@/lib/practice/practice";
import type { CardProgress } from "@/lib/scheduler/scheduler";
import type { VocabularyCard } from "@/lib/vocabulary/types";
import { buildLearningLoopInsight } from "./insights";

const now = new Date("2026-07-02T08:00:00.000Z");

describe("learning loop insights", () => {
  it("summarizes daily plan, review reminder, mastery, and weak areas", () => {
    const insight = buildLearningLoopInsight({
      cards: [card("a"), card("b"), card("c")],
      progress: {
        a: progress({ status: "known", dueAt: "2026-07-01T08:00:00.000Z", knownCount: 3 }),
        b: progress({ status: "learning", dueAt: "2026-07-04T08:00:00.000Z", fuzzyCount: 2 }),
      },
      favoriteIds: ["b"],
      practiceSessions: [session(["b", "c"])],
      dailyGoal: 10,
      now,
    });

    expect(insight.dueCount).toBe(1);
    expect(insight.newCount).toBe(1);
    expect(insight.reviewReminderLabel).toBe("现在复习");
    expect(insight.reviewedMasteryRate).toBe(50);
    expect(insight.deckMasteryRate).toBe(33);
    expect(insight.weakSummary).toContain("2 个");
    expect(insight.weakAreas.map((area) => area.label)).toContain("AI 小测错题");
  });

  it("points to the next scheduled review when nothing is due", () => {
    const insight = buildLearningLoopInsight({
      cards: [card("a")],
      progress: {
        a: progress({ status: "known", dueAt: "2026-07-04T08:00:00.000Z", knownCount: 1 }),
      },
      favoriteIds: [],
      practiceSessions: [],
      dailyGoal: 5,
      now,
    });

    expect(insight.dueCount).toBe(0);
    expect(insight.reviewReminderLabel).toBe("2 天后复习");
  });
});

function card(id: string): VocabularyCard {
  return {
    id,
    level: "CET4",
    word: id,
    kana: "",
    meaningZh: id,
    partOfSpeech: "noun",
    exampleJa: "",
    exampleZh: "",
    tags: ["cet4"],
  };
}

function progress(overrides: Partial<CardProgress>): CardProgress {
  return {
    status: "learning",
    ease: 2.5,
    intervalDays: 1,
    dueAt: "2026-07-03T08:00:00.000Z",
    reviewCount: 1,
    knownCount: 0,
    fuzzyCount: 0,
    unknownCount: 0,
    ...overrides,
  };
}

function session(weakCardIds: string[]): PracticeSessionSummary {
  return {
    id: "practice-1",
    level: "CET4",
    mode: "weak",
    title: "CET-4 错题专项",
    takenAt: "2026-07-02T07:00:00.000Z",
    total: 2,
    correct: 0,
    accuracy: 0,
    weakCardIds,
  };
}
