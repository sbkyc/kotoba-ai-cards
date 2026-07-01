import { describe, expect, it } from "vitest";
import type { CardProgress } from "@/lib/scheduler/scheduler";
import type { VocabularyCard } from "@/lib/vocabulary/types";
import {
  buildMistakeBook,
  buildMistakeRetakePaper,
  buildPracticeSessionRecord,
  buildPracticeSourceCards,
  buildWeakCardSummaries,
  gradePracticeSession,
  normalizePracticePaper,
} from "./practice";

const cards = [
  makeCard("cet-4-abandon", "abandon"),
  makeCard("cet-4-ability", "ability"),
  makeCard("cet-4-able", "able"),
  makeCard("cet-4-about", "about"),
];

describe("practice", () => {
  it("builds a practice source queue with weak cards first and fills with new cards", () => {
    const progress: Record<string, CardProgress> = {
      "cet-4-ability": makeProgress({ fuzzyCount: 2 }),
      "cet-4-abandon": makeProgress({ unknownCount: 1 }),
    };

    const source = buildPracticeSourceCards(cards, progress, { size: 3 });

    expect(source.map((card) => card.id)).toEqual(["cet-4-abandon", "cet-4-ability", "cet-4-able"]);
  });

  it("builds a new-word practice queue from unstudied cards first", () => {
    const progress: Record<string, CardProgress> = {
      "cet-4-abandon": makeProgress({ knownCount: 1, status: "known" }),
      "cet-4-ability": makeProgress({ fuzzyCount: 1 }),
    };

    const source = buildPracticeSourceCards(cards, progress, { size: 2, mode: "new" });

    expect(source.map((card) => card.id)).toEqual(["cet-4-able", "cet-4-about"]);
  });

  it("builds a favorite practice queue only from favorite cards", () => {
    const progress: Record<string, CardProgress> = {
      "cet-4-about": makeProgress({ unknownCount: 1 }),
    };

    const source = buildPracticeSourceCards(cards, progress, {
      size: 3,
      mode: "favorites",
      favoriteIds: ["cet-4-able", "cet-4-about"],
    });

    expect(source.map((card) => card.id)).toEqual(["cet-4-about", "cet-4-able"]);
  });

  it("builds a mock practice queue with a stable spread across the deck", () => {
    const source = buildPracticeSourceCards(cards, {}, { size: 3, mode: "mock" });

    expect(source.map((card) => card.id)).toEqual(["cet-4-abandon", "cet-4-able", "cet-4-about"]);
  });

  it("normalizes AI paper payloads and keeps only questions tied to source cards", () => {
    const paper = normalizePracticePaper(
      {
        kind: "practice-paper",
        title: "CET-4 错题专项",
        questions: [
          {
            cardId: "cet-4-abandon",
            stem: "The team had to ____ the old plan.",
            options: ["A abandon", "B obtain", "C contain", "D maintain"],
            answer: "A abandon",
            explanation: "abandon means give up.",
          },
          {
            cardId: "missing",
            stem: "Invalid source should be ignored.",
            options: ["A one", "B two"],
            answer: "A one",
          },
        ],
      },
      cards,
    );

    expect(paper.questions).toHaveLength(1);
    expect(paper.questions[0]).toMatchObject({
      cardId: "cet-4-abandon",
      stem: "The team had to ____ the old plan.",
      answer: "A abandon",
    });
  });

  it("keeps only complete four-option questions whose answer matches an option", () => {
    const paper = normalizePracticePaper(
      {
        questions: [
          {
            cardId: "cet-4-abandon",
            stem: "Valid question.",
            options: ["A abandon", "B obtain", "C contain", "D maintain"],
            answer: "A",
            explanation: "A is correct.",
          },
          {
            cardId: "cet-4-ability",
            stem: "Too few options.",
            options: ["A able", "B ability"],
            answer: "B ability",
          },
          {
            cardId: "cet-4-able",
            stem: "Answer is not in options.",
            options: ["A abandon", "B obtain", "C contain", "D maintain"],
            answer: "E missing",
          },
        ],
      },
      cards,
    );

    expect(paper.questions.map((question) => question.cardId)).toEqual(["cet-4-abandon"]);
    expect(paper.questions[0].answer).toBe("A abandon");
  });

  it("grades a session and maps correct answers to review ratings", () => {
    const paper = normalizePracticePaper(
      {
        questions: [
          {
            id: "q1",
            cardId: "cet-4-abandon",
            stem: "The team had to ____ the old plan.",
            options: ["A abandon", "B obtain", "C contain", "D maintain"],
            answer: "A abandon",
            explanation: "abandon means give up.",
          },
          {
            id: "q2",
            cardId: "cet-4-ability",
            stem: "She has the ____ to solve it.",
            options: ["A able", "B ability", "C about", "D abandon"],
            answer: "B ability",
            explanation: "ability is the noun.",
          },
        ],
      },
      cards,
    );

    const report = gradePracticeSession(paper.questions, {
      q1: "A abandon",
      q2: "A able",
    });

    expect(report).toMatchObject({ total: 2, correct: 1, accuracy: 50 });
    expect(report.ratingsByCardId).toEqual({
      "cet-4-abandon": "known",
      "cet-4-ability": "unknown",
    });
    expect(report.weakQuestions.map((question) => question.cardId)).toEqual(["cet-4-ability"]);
  });

  it("accepts option-letter answers from AI when the learner selected the full option text", () => {
    const paper = normalizePracticePaper(
      {
        questions: [
          {
            id: "q1",
            cardId: "cet-4-abandon",
            stem: "The team had to ____ the old plan.",
            options: ["A abandon", "B obtain", "C contain", "D maintain"],
            answer: "A",
            explanation: "abandon means give up.",
          },
        ],
      },
      cards,
    );

    const report = gradePracticeSession(paper.questions, { q1: "A abandon" });

    expect(report.correct).toBe(1);
    expect(report.ratingsByCardId).toEqual({ "cet-4-abandon": "known" });
  });

  it("accepts answer text without an option letter when it matches the selected option body", () => {
    const paper = normalizePracticePaper(
      {
        questions: [
          {
            id: "q1",
            cardId: "cet-4-abandon",
            stem: "The team had to ____ the old plan.",
            options: ["A abandon", "B obtain", "C contain", "D maintain"],
            answer: "abandon",
            explanation: "abandon means give up.",
          },
        ],
      },
      cards,
    );

    const report = gradePracticeSession(paper.questions, { q1: "A abandon" });

    expect(report.correct).toBe(1);
  });

  it("summarizes weak questions as reviewable vocabulary cards", () => {
    const weakQuestions = [
      {
        id: "q1",
        cardId: "cet-4-abandon",
        stem: "The team had to ____ the old plan.",
        options: ["A abandon", "B obtain"],
        answer: "A abandon",
        explanation: "abandon means give up.",
        skill: "词汇语境",
      },
    ];

    expect(buildWeakCardSummaries(weakQuestions, cards)).toEqual([
      {
        id: "cet-4-abandon",
        word: "abandon",
        kana: "",
        meaningZh: "abandon 的中文释义",
      },
    ]);
  });

  it("builds a practice session record with question details and learner answers", () => {
    const paper = normalizePracticePaper(
      {
        title: "CET-4 错题专项",
        questions: [
          {
            id: "q1",
            cardId: "cet-4-abandon",
            stem: "The team had to ____ the old plan.",
            options: ["A abandon", "B obtain", "C contain", "D maintain"],
            answer: "A",
            explanation: "abandon means give up.",
          },
        ],
      },
      cards,
    );
    const answersByQuestionId = { q1: "A abandon" };
    const report = gradePracticeSession(paper.questions, answersByQuestionId);

    const session = buildPracticeSessionRecord({
      id: "practice-1",
      level: "CET4",
      mode: "weak",
      paper,
      report,
      answersByQuestionId,
      takenAt: new Date("2026-07-01T08:00:00.000Z"),
    });

    expect(session).toMatchObject({
      id: "practice-1",
      level: "CET4",
      mode: "weak",
      title: "CET-4 错题专项",
      takenAt: "2026-07-01T08:00:00.000Z",
      total: 1,
      correct: 1,
      accuracy: 100,
      weakCardIds: [],
      answersByQuestionId,
    });
    expect(session.questions).toHaveLength(1);
  });

  it("builds a mistake book ranked by repeated wrong answers", () => {
    const session = {
      id: "practice-1",
      level: "CET4" as const,
      mode: "weak" as const,
      title: "CET-4 错题专项",
      takenAt: "2026-07-01T08:00:00.000Z",
      total: 2,
      correct: 0,
      accuracy: 0,
      weakCardIds: ["cet-4-ability", "cet-4-abandon"],
      questions: [
        {
          id: "q1",
          cardId: "cet-4-ability",
          stem: "She has the ____ to solve it.",
          options: ["A able", "B ability"],
          answer: "B ability",
          explanation: "ability is the noun.",
          skill: "词性辨析",
        },
        {
          id: "q2",
          cardId: "cet-4-abandon",
          stem: "They ____ the plan.",
          options: ["A abandon", "B obtain"],
          answer: "A abandon",
          explanation: "abandon means give up.",
          skill: "词汇语境",
        },
      ],
      answersByQuestionId: { q1: "A able", q2: "B obtain" },
    };

    const book = buildMistakeBook([session, session], cards);

    expect(book.map((item) => [item.card.id, item.wrongCount])).toEqual([
      ["cet-4-ability", 2],
      ["cet-4-abandon", 2],
    ]);
    expect(book[0].lastQuestion?.stem).toContain("She has");
  });

  it("builds a retake paper from mistake book items", () => {
    const book = buildMistakeBook([
      {
        id: "practice-1",
        level: "CET4",
        title: "CET-4 错题专项",
        takenAt: "2026-07-01T08:00:00.000Z",
        total: 1,
        correct: 0,
        accuracy: 0,
        weakCardIds: ["cet-4-ability"],
        questions: [
          {
            id: "q1",
            cardId: "cet-4-ability",
            stem: "She has the ____ to solve it.",
            options: ["A able", "B ability", "C about", "D abandon"],
            answer: "B ability",
            explanation: "ability is the noun.",
            skill: "词性辨析",
          },
        ],
        answersByQuestionId: { q1: "A able" },
      },
    ], cards);

    const paper = buildMistakeRetakePaper(book, 5);

    expect(paper).toMatchObject({
      kind: "practice-paper",
      title: "错题本复训",
    });
    expect(paper.questions).toHaveLength(1);
    expect(paper.questions[0]).toMatchObject({ cardId: "cet-4-ability", id: "mistake-1" });
  });

  it("builds meaning-based fallback questions for legacy mistake records", () => {
    const book = buildMistakeBook([
      {
        id: "legacy-practice",
        level: "CET4",
        title: "Legacy",
        takenAt: "2026-07-01T08:00:00.000Z",
        total: 1,
        correct: 0,
        accuracy: 0,
        weakCardIds: ["cet-4-about"],
      },
    ], cards);

    const paper = buildMistakeRetakePaper(book, 1);

    expect(paper.questions[0]).toMatchObject({
      cardId: "cet-4-about",
      stem: "「about」最符合哪一项释义或用法？",
      answer: "A about 的中文释义",
      skill: "错题复训",
    });
    expect(paper.questions[0].options).toHaveLength(4);
  });
});

function makeCard(id: string, word: string): VocabularyCard {
  return {
    id,
    level: "CET4",
    word,
    kana: "",
    meaningZh: `${word} 的中文释义`,
    partOfSpeech: "v.",
    exampleJa: "",
    exampleZh: "",
    tags: [],
  };
}

function makeProgress(overrides: Partial<CardProgress>): CardProgress {
  return {
    status: "learning",
    ease: 2.5,
    intervalDays: 0,
    dueAt: new Date(0).toISOString(),
    reviewCount: 1,
    knownCount: 0,
    fuzzyCount: 0,
    unknownCount: 0,
    ...overrides,
  };
}
