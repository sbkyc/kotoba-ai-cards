import { describe, expect, it } from "vitest";
import { buildStudyQueue } from "./queue";
import type { CardProgress } from "@/lib/scheduler/scheduler";
import type { VocabularyCard } from "@/lib/vocabulary/types";

const cards: VocabularyCard[] = [
  {
    id: "new-a",
    level: "N2",
    word: "新規",
    kana: "しんき",
    meaningZh: "新建，新规",
    partOfSpeech: "名词",
    exampleJa: "新規の申し込みを受け付ける。",
    exampleZh: "受理新申请。",
    tags: ["daily"],
  },
  {
    id: "due-b",
    level: "N2",
    word: "確認",
    kana: "かくにん",
    meaningZh: "确认",
    partOfSpeech: "名词・する动词",
    exampleJa: "内容を確認する。",
    exampleZh: "确认内容。",
    tags: ["work"],
  },
  {
    id: "future-c",
    level: "N2",
    word: "効果",
    kana: "こうか",
    meaningZh: "效果",
    partOfSpeech: "名词",
    exampleJa: "効果が出る。",
    exampleZh: "见效。",
    tags: ["abstract"],
  },
];

const progress: Record<string, CardProgress> = {
  "due-b": {
    status: "learning",
    ease: 2.4,
    intervalDays: 1,
    dueAt: "2026-06-16T00:00:00.000Z",
    lastReviewedAt: "2026-06-15T00:00:00.000Z",
    reviewCount: 1,
    knownCount: 0,
    fuzzyCount: 1,
    unknownCount: 0,
  },
  "future-c": {
    status: "known",
    ease: 2.65,
    intervalDays: 3,
    dueAt: "2026-06-20T00:00:00.000Z",
    lastReviewedAt: "2026-06-15T00:00:00.000Z",
    reviewCount: 1,
    knownCount: 1,
    fuzzyCount: 0,
    unknownCount: 0,
  },
};

describe("buildStudyQueue", () => {
  it("puts due reviews before new cards and excludes future cards", () => {
    const queue = buildStudyQueue(cards, progress, {
      now: new Date("2026-06-16T08:00:00.000Z"),
      dailyGoal: 2,
    });

    expect(queue.map((card) => card.id)).toEqual(["due-b", "new-a"]);
  });

  it("limits new cards by the remaining daily goal after due reviews", () => {
    const queue = buildStudyQueue(cards, progress, {
      now: new Date("2026-06-16T08:00:00.000Z"),
      dailyGoal: 1,
    });

    expect(queue.map((card) => card.id)).toEqual(["due-b"]);
  });

  it("prioritizes difficult due cards before easier due cards", () => {
    const queue = buildStudyQueue([cards[1], cards[0], cards[2]], {
      ...progress,
      "new-a": {
        status: "learning",
        ease: 1.8,
        intervalDays: 0,
        dueAt: "2026-06-16T00:00:00.000Z",
        lastReviewedAt: "2026-06-15T00:00:00.000Z",
        reviewCount: 3,
        knownCount: 0,
        fuzzyCount: 1,
        unknownCount: 2,
      },
    }, {
      now: new Date("2026-06-16T08:00:00.000Z"),
      dailyGoal: 3,
    });

    expect(queue.map((card) => card.id).slice(0, 2)).toEqual(["new-a", "due-b"]);
  });

  it("builds a difficult review queue from cards with mistakes first", () => {
    const queue = buildStudyQueue(cards, {
      ...progress,
      "new-a": {
        status: "learning",
        ease: 1.8,
        intervalDays: 0,
        dueAt: "2026-06-16T00:00:00.000Z",
        lastReviewedAt: "2026-06-15T00:00:00.000Z",
        reviewCount: 4,
        knownCount: 0,
        fuzzyCount: 1,
        unknownCount: 2,
      },
      "future-c": {
        ...progress["future-c"],
        status: "learning",
        fuzzyCount: 3,
      },
    }, {
      now: new Date("2026-06-16T08:00:00.000Z"),
      dailyGoal: 5,
      mode: "difficult",
    });

    expect(queue.map((card) => card.id)).toEqual(["new-a", "future-c", "due-b"]);
  });

  it("builds a favorites queue from starred cards only", () => {
    const queue = buildStudyQueue(cards, progress, {
      now: new Date("2026-06-16T08:00:00.000Z"),
      dailyGoal: 5,
      mode: "favorites",
      favoriteIds: ["future-c", "new-a"],
    });

    expect(queue.map((card) => card.id)).toEqual(["new-a", "future-c"]);
  });

  it("builds a core queue from high-coverage words before advanced words", () => {
    const coreCards: VocabularyCard[] = [
      {
        id: "rare-gre",
        level: "CET4",
        word: "abstruse",
        kana: "/əbˈstruːs/",
        meaningZh: "深奥的",
        partOfSpeech: "adjective",
        exampleJa: "The argument is abstruse.",
        exampleZh: "这个论证很深奥。",
        tags: ["gre"],
      },
      {
        id: "core-the",
        level: "CET4",
        word: "the",
        kana: "/ði/",
        meaningZh: "这个；那个",
        partOfSpeech: "article",
        exampleJa: "The book is here.",
        exampleZh: "那本书在这里。",
        tags: ["zk", "gk", "cet4"],
      },
      {
        id: "core-make",
        level: "CET4",
        word: "make",
        kana: "/meɪk/",
        meaningZh: "制作；使得",
        partOfSpeech: "verb",
        exampleJa: "Make a sentence.",
        exampleZh: "造一个句子。",
        tags: ["gk", "cet4"],
      },
    ];

    const queue = buildStudyQueue(coreCards, {}, {
      now: new Date("2026-06-16T08:00:00.000Z"),
      dailyGoal: 2,
      mode: "core",
    });

    expect(queue.map((card) => card.id)).toEqual(["core-the", "core-make"]);
  });
});
