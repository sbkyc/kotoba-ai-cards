import { describe, expect, it } from "vitest";
import { buildDifferencePrompt, buildExamplePrompt, buildPracticePaperPrompt, buildQuizPrompt } from "./prompts";
import { findExamSection } from "@/lib/practice/examSections";
import type { VocabularyCard } from "@/lib/vocabulary/types";

const card: VocabularyCard = {
  id: "n2-houshin",
  level: "N2",
  word: "??",
  kana: "????",
  meaningZh: "?????",
  partOfSpeech: "??",
  exampleJa: "??????????????",
  exampleZh: "??????????",
  tags: ["business", "abstract"],
  relatedWords: ["??", "??"],
};

const cetCard: VocabularyCard = {
  id: "cet4-abandon",
  level: "CET4",
  word: "abandon",
  kana: "/??b?nd?n/",
  meaningZh: "?????",
  partOfSpeech: "verb",
  exampleJa: "Do not abandon your plan too early.",
  exampleZh: "???????????",
  tags: ["core", "verb"],
  relatedWords: ["quit", "desert"],
};

describe("AI prompts", () => {
  it("builds an example prompt with structured JSON instruction", () => {
    const prompt = buildExamplePrompt(card);

    expect(prompt).toContain("??");
    expect(prompt).toContain("JLPT N2");
    expect(prompt).toContain("JSON");
    expect(prompt).toContain("exampleJa");
  });

  it("builds an English CET prompt for English vocabulary", () => {
    const prompt = buildExamplePrompt(cetCard);

    expect(prompt).toContain("CET-4");
    expect(prompt).toContain("????");
    expect(prompt).toContain("abandon");
    expect(prompt).not.toContain("????");
  });

  it("builds a difference prompt with related words", () => {
    const prompt = buildDifferencePrompt(card);

    expect(prompt).toContain("??");
    expect(prompt).toContain("??");
    expect(prompt).toContain("usageComparison");
  });

  it("builds a quiz prompt with four options instruction", () => {
    const prompt = buildQuizPrompt(card);

    expect(prompt).toContain("???");
    expect(prompt).toContain("??");
    expect(prompt).toContain("????");
    expect(prompt).toContain("options");
  });

  it("builds a CET quiz prompt in original exam-style format", () => {
    const prompt = buildQuizPrompt(cetCard);

    expect(prompt).toContain("CET-4");
    expect(prompt).toContain("????");
    expect(prompt).toContain("????");
    expect(prompt).toContain("????????");
    expect(prompt).toContain('"kind": "exam-quiz"');
    expect(prompt).toContain("memoryCheck");
  });

  it("builds a JLPT quiz prompt in vocabulary and grammar style", () => {
    const prompt = buildQuizPrompt(card);

    expect(prompt).toContain("?????");
    expect(prompt).toContain("??");
    expect(prompt).toContain("???");
    expect(prompt).toContain("????????");
    expect(prompt).toContain('"examSection"');
  });

  it("builds a practice paper prompt tied to source card ids", () => {
    const prompt = buildPracticePaperPrompt([cetCard, card], {
      questionCount: 2,
      examSection: findExamSection("CET4", "cet-cloze"),
    });

    expect(prompt).toContain('"kind": "practice-paper"');
    expect(prompt).toContain('"cardId": "cet4-abandon"');
    expect(prompt).toContain('"cardId": "n2-houshin"');
    expect(prompt).toContain("?????CET ????");
    expect(prompt).toContain('"examSection": "CET ????"');
    expect(prompt).toContain('"questions"');
    expect(prompt).toContain("2");
  });
});
