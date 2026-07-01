import { describe, expect, it } from "vitest";
import { getExampleDetail, getRelatedWordsDetail } from "./details";
import type { VocabularyCard } from "./types";

const card: VocabularyCard = {
  id: "cet-4-abandon",
  level: "CET4",
  word: "abandon",
  kana: "/uh-ban-duhn/",
  meaningZh: "give up",
  partOfSpeech: "verb",
  exampleJa: "",
  exampleZh: "",
  tags: ["cet"],
};

describe("vocabulary details", () => {
  it("explains when an imported card has no example", () => {
    expect(getExampleDetail(card)).toEqual({
      primary: "暂无例句",
      secondary: "该导入词条暂未收录例句，可在学习页使用 AI 生成原创例句。",
    });
  });

  it("returns source word forms as related words", () => {
    expect(getRelatedWordsDetail({ ...card, relatedWords: ["abandoned", "abandoning"] })).toBe(
      "abandoned / abandoning",
    );
  });
});
