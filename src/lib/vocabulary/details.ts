import type { VocabularyCard } from "./types";

export type ExampleDetail = {
  primary: string;
  secondary: string;
};

export function getExampleDetail(card: VocabularyCard): ExampleDetail {
  const primary = card.exampleJa.trim();
  const secondary = card.exampleZh.trim();

  if (primary || secondary) {
    return { primary, secondary };
  }

  return {
    primary: "暂无例句",
    secondary: "该导入词条暂未收录例句，可在学习页使用 AI 生成原创例句。",
  };
}

export function getRelatedWordsDetail(card: VocabularyCard): string {
  return card.relatedWords?.length ? card.relatedWords.join(" / ") : "暂无易混词或词形变化";
}
