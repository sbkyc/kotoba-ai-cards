import { describe, expect, it } from "vitest";
import { buildVocabularyEvidence, getSourceTagLabels } from "./trust";
import type { VocabularyCard } from "./types";

describe("vocabulary trust evidence", () => {
  it("shows source tags and a tag-backed recommendation for CET exam words", () => {
    const evidence = buildVocabularyEvidence({
      ...makeCard(),
      tags: ["cet4", "gk", "toefl"],
      partOfSpeech: "verb",
    });

    expect(evidence.sourceBadges.map((badge) => badge.label)).toContain("ECDICT CET-4");
    expect(evidence.sourceBadges.map((badge) => badge.label)).toContain("高考词表标签");
    expect(evidence.recommendationBadges).toContain("常考词");
    expect(evidence.reason).toContain("来源标签");
    expect(evidence.caution).toContain("不等同于真题频次统计");
  });

  it("keeps GRE-only advanced words from looking like high-frequency exam words", () => {
    const evidence = buildVocabularyEvidence({
      ...makeCard(),
      word: "abstruse",
      tags: ["gre"],
      partOfSpeech: "adjective",
    });

    expect(evidence.sourceBadges.map((badge) => badge.label)).toContain("GRE 标签");
    expect(evidence.recommendationBadges).not.toContain("常考词");
    expect(evidence.reason).toContain("暂未进入核心或常考优先队列");
  });

  it("marks JLPT vocabulary as community-reference evidence instead of official lists", () => {
    const evidence = buildVocabularyEvidence({
      ...makeCard(),
      id: "jlpt-n3-ataru",
      level: "N3",
      word: "当たる",
      kana: "あたる",
      tags: ["jlpt", "n3"],
      partOfSpeech: "动词",
    });

    expect(evidence.sourceBadges.map((badge) => badge.label)).toContain("JLPT N3 参考词表");
    expect(evidence.caution).toContain("社区参考词表");
  });

  it("maps raw source tags to readable labels", () => {
    expect(getSourceTagLabels(["cet6", "ky", "unknown-tag"])).toEqual([
      "ECDICT CET-6",
      "考研词表标签",
    ]);
  });
});

function makeCard(): VocabularyCard {
  return {
    id: "cet4-abandon",
    level: "CET4",
    word: "abandon",
    kana: "/əˈbændən/",
    meaningZh: "放弃，抛弃",
    partOfSpeech: "verb",
    exampleJa: "",
    exampleZh: "",
    tags: ["cet4"],
  };
}
