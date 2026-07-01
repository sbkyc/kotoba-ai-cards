import { describe, expect, it } from "vitest";
import { buildDifferencePrompt, buildExamplePrompt, buildPracticePaperPrompt, buildQuizPrompt } from "./prompts";
import type { VocabularyCard } from "@/lib/vocabulary/types";

const card: VocabularyCard = {
  id: "n2-houshin",
  level: "N2",
  word: "方針",
  kana: "ほうしん",
  meaningZh: "方针，方向",
  partOfSpeech: "名词",
  exampleJa: "会社は新しい方針を発表した。",
  exampleZh: "公司发表了新的方针。",
  tags: ["business", "abstract"],
  relatedWords: ["方法", "方向"],
};

const cetCard: VocabularyCard = {
  id: "cet4-abandon",
  level: "CET4",
  word: "abandon",
  kana: "/əˈbændən/",
  meaningZh: "放弃，抛弃",
  partOfSpeech: "verb",
  exampleJa: "Do not abandon your plan too early.",
  exampleZh: "不要太早放弃你的计划。",
  tags: ["core", "verb"],
  relatedWords: ["quit", "desert"],
};

describe("AI prompts", () => {
  it("builds an example prompt with structured JSON instruction", () => {
    const prompt = buildExamplePrompt(card);

    expect(prompt).toContain("方針");
    expect(prompt).toContain("JLPT N2");
    expect(prompt).toContain("JSON");
    expect(prompt).toContain("exampleJa");
  });

  it("builds an English CET prompt for English vocabulary", () => {
    const prompt = buildExamplePrompt(cetCard);

    expect(prompt).toContain("CET-4");
    expect(prompt).toContain("英文例句");
    expect(prompt).toContain("abandon");
    expect(prompt).not.toContain("日语例句");
  });

  it("builds a difference prompt with related words", () => {
    const prompt = buildDifferencePrompt(card);

    expect(prompt).toContain("方法");
    expect(prompt).toContain("方向");
    expect(prompt).toContain("usageComparison");
  });

  it("builds a quiz prompt with four options instruction", () => {
    const prompt = buildQuizPrompt(card);

    expect(prompt).toContain("四选一");
    expect(prompt).toContain("方針");
    expect(prompt).toContain("options");
  });

  it("builds a CET quiz prompt in original exam-style format", () => {
    const prompt = buildQuizPrompt(cetCard);

    expect(prompt).toContain("CET-4");
    expect(prompt).toContain("真题风格");
    expect(prompt).toContain("词汇语境");
    expect(prompt).toContain("不要复制真题原文");
    expect(prompt).toContain('"kind": "exam-quiz"');
    expect(prompt).toContain("memoryCheck");
  });

  it("builds a JLPT quiz prompt in vocabulary and grammar style", () => {
    const prompt = buildQuizPrompt(card);

    expect(prompt).toContain("文字・語彙");
    expect(prompt).toContain("文法");
    expect(prompt).toContain("（　）");
    expect(prompt).toContain("不要复制真题原文");
    expect(prompt).toContain('"examSection"');
  });

  it("builds a practice paper prompt tied to source card ids", () => {
    const prompt = buildPracticePaperPrompt([cetCard, card], { questionCount: 2 });

    expect(prompt).toContain('"kind": "practice-paper"');
    expect(prompt).toContain('"cardId": "cet4-abandon"');
    expect(prompt).toContain('"cardId": "n2-houshin"');
    expect(prompt).toContain('"questions"');
    expect(prompt).toContain("2");
  });
});
