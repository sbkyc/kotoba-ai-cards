import { describe, expect, it } from "vitest";
import { findExamSection } from "@/lib/practice/examSections";
import type { VocabularyCard } from "@/lib/vocabulary/types";
import { buildOfflineExamQuizPayload, buildOfflinePracticePaper } from "./offlinePaper";

describe("offline practice paper", () => {
  it("generates complete four-option questions tied to the selected source cards", () => {
    const paper = buildOfflinePracticePaper(englishCards, {
      questionCount: 3,
      examSection: findExamSection("CET4", "cet-vocabulary-context"),
    });

    expect(paper).toMatchObject({
      kind: "practice-paper",
      title: "CET ???? ? ????",
    });
    expect(paper.questions).toHaveLength(3);

    for (const [index, question] of paper.questions.entries()) {
      expect(question.cardId).toBe(englishCards[index].id);
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options).size).toBe(4);
      expect(question.options).toContain(question.answer);
      expect(question.examSection).toBe("CET ????");
      expect(question.questionType).toBe("???????");
    }
  });

  it("uses CET-style blank stems for vocabulary context modules", () => {
    const paper = buildOfflinePracticePaper(englishCards, {
      questionCount: 1,
      examSection: findExamSection("CET4", "cet-cloze"),
    });

    expect(paper.questions[0].stem).toContain("____");
    expect(paper.questions[0].skill).toBe("????");
  });

  it("uses JLPT-style Japanese blanks for moji-goi modules", () => {
    const paper = buildOfflinePracticePaper(japaneseCards, {
      questionCount: 1,
      examSection: findExamSection("N3", "jlpt-moji-goi"),
    });

    expect(paper.title).toBe("JLPT ???? ? ????");
    expect(paper.questions[0].stem).toContain("???");
    expect(paper.questions[0].examSection).toBe("JLPT ????");
  });

  it("falls back to stable synthetic distractors when the deck is too small", () => {
    const paper = buildOfflinePracticePaper(englishCards.slice(0, 1), {
      questionCount: 1,
      examSection: findExamSection("CET4", "cet-reading-meaning"),
    });

    expect(paper.questions[0].options).toHaveLength(4);
    expect(new Set(paper.questions[0].options).size).toBe(4);
    expect(paper.questions[0].stem).toContain("meaning is closest to");
  });

  it("uses a definition-clue fallback instead of a generic target-word sentence", () => {
    const paper = buildOfflinePracticePaper([makeCard("cet-4-brief", "CET4", "brief", "??????", "adj.", "", "")], {
      questionCount: 1,
      examSection: findExamSection("CET4", "cet-vocabulary-context"),
    });

    expect(paper.questions[0].stem).toContain("____");
    expect(paper.questions[0].stem).toContain("??????");
    expect(paper.questions[0].stem).not.toContain("The target word is");
  });

  it("builds a single-card offline exam quiz payload for study cards", () => {
    const payload = buildOfflineExamQuizPayload(englishCards[0], englishCards, findExamSection("CET4", "cet-cloze"));

    expect(payload).toMatchObject({
      kind: "exam-quiz",
      examSection: "CET ????",
      questionType: "???????",
      answer: expect.stringContaining("abandon"),
    });
    expect(payload.options).toHaveLength(4);
    expect(payload.question).toContain("____");
  });
});

const englishCards: VocabularyCard[] = [
  makeCard("cet-4-abandon", "CET4", "abandon", "?????", "v.", "The team had to abandon the old plan.", "???????????"),
  makeCard("cet-4-ability", "CET4", "ability", "?????", "n.", "She has the ability to solve it.", "????????"),
  makeCard("cet-4-benefit", "CET4", "benefit", "??????", "n./v.", "The policy will benefit students.", "???????????"),
  makeCard("cet-4-maintain", "CET4", "maintain", "?????", "v.", "They maintain a steady pace.", "?????????"),
];

const japaneseCards: VocabularyCard[] = [
  makeCard("jlpt-n3-??", "N3", "??", "?????", "?/??", "??????????????", "?????????", "????"),
  makeCard("jlpt-n3-??", "N3", "??", "?????", "?", "????????????", "????????", "???"),
  makeCard("jlpt-n3-??", "N3", "??", "??", "?/??", "????????", "?????", "????"),
  makeCard("jlpt-n3-??", "N3", "??", "??", "?/??", "?????????", "?????", "????"),
];

function makeCard(
  id: string,
  level: VocabularyCard["level"],
  word: string,
  meaningZh: string,
  partOfSpeech: string,
  exampleJa: string,
  exampleZh: string,
  kana = "",
): VocabularyCard {
  return {
    id,
    level,
    word,
    kana,
    meaningZh,
    partOfSpeech,
    exampleJa,
    exampleZh,
    tags: [],
  };
}
