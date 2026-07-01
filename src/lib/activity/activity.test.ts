import { describe, expect, it } from "vitest";
import { aggregateRecentActivity, filterReviewEventsByCardIds, rankDifficultCards, type ReviewEvent } from "./activity";
import type { CardProgress } from "@/lib/scheduler/scheduler";
import type { VocabularyCard } from "@/lib/vocabulary/types";

const events: ReviewEvent[] = [
  { cardId: "a", rating: "known", reviewedAt: "2026-06-19T08:00:00.000Z" },
  { cardId: "b", rating: "unknown", reviewedAt: "2026-06-19T09:00:00.000Z" },
  { cardId: "a", rating: "fuzzy", reviewedAt: "2026-06-18T09:00:00.000Z" },
];

describe("aggregateRecentActivity", () => {
  it("returns seven ordered days including empty days", () => {
    expect(aggregateRecentActivity(events, new Date("2026-06-19T12:00:00.000Z"))).toEqual([
      { date: "2026-06-13", count: 0 },
      { date: "2026-06-14", count: 0 },
      { date: "2026-06-15", count: 0 },
      { date: "2026-06-16", count: 0 },
      { date: "2026-06-17", count: 0 },
      { date: "2026-06-18", count: 1 },
      { date: "2026-06-19", count: 2 },
    ]);
  });

  it("filters review events by card id before aggregation", () => {
    expect(filterReviewEventsByCardIds(events, ["a"])).toEqual([
      { cardId: "a", rating: "known", reviewedAt: "2026-06-19T08:00:00.000Z" },
      { cardId: "a", rating: "fuzzy", reviewedAt: "2026-06-18T09:00:00.000Z" },
    ]);
  });

  it("groups review events by the caller's local day offset", () => {
    const lateNightEvents: ReviewEvent[] = [
      { cardId: "a", rating: "known", reviewedAt: "2026-06-18T16:30:00.000Z" },
    ];

    expect(aggregateRecentActivity(lateNightEvents, new Date("2026-06-19T12:00:00.000Z"), 480).at(-1)).toEqual({
      date: "2026-06-19",
      count: 1,
    });
  });
});

describe("rankDifficultCards", () => {
  it("ranks unknown and fuzzy history above easier cards", () => {
    const cards = [
      vocabulary("easy"),
      vocabulary("hard"),
    ];
    const progress: Record<string, CardProgress> = {
      easy: cardProgress({ knownCount: 2 }),
      hard: cardProgress({ unknownCount: 2, fuzzyCount: 1, status: "learning" }),
    };

    expect(rankDifficultCards(cards, progress, [], 2).map((card) => card.id)).toEqual(["hard", "easy"]);
  });
});

function vocabulary(id: string): VocabularyCard {
  return {
    id,
    level: "N2",
    word: id,
    kana: id,
    meaningZh: id,
    partOfSpeech: "名词",
    exampleJa: id,
    exampleZh: id,
    tags: [],
  };
}

function cardProgress(overrides: Partial<CardProgress>): CardProgress {
  return {
    status: "known",
    ease: 2.5,
    intervalDays: 3,
    dueAt: "2026-06-20T00:00:00.000Z",
    reviewCount: 2,
    knownCount: 0,
    fuzzyCount: 0,
    unknownCount: 0,
    ...overrides,
  };
}
