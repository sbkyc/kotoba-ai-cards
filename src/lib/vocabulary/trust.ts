import {
  getCoreVocabularyScore,
  getExamFocusVocabularyScore,
  isCoreVocabularyCard,
  isExamFocusVocabularyCard,
} from "./core";
import { getStudyLevelMeta } from "./data";
import type { VocabularyCard } from "./types";

export type VocabularySourceBadge = {
  label: string;
  detail: string;
};

export type VocabularyEvidence = {
  sourceBadges: VocabularySourceBadge[];
  recommendationBadges: string[];
  reason: string;
  caution: string;
};

const englishExamSourceTags: Record<string, VocabularySourceBadge> = {
  cet4: {
    label: "ECDICT CET-4",
    detail: "导入源自带 cet4 考试标签。",
  },
  "cet-4": {
    label: "ECDICT CET-4",
    detail: "导入源自带 cet-4 考试标签。",
  },
  cet6: {
    label: "ECDICT CET-6",
    detail: "导入源自带 cet6 考试标签。",
  },
  "cet-6": {
    label: "ECDICT CET-6",
    detail: "导入源自带 cet-6 考试标签。",
  },
  gk: {
    label: "高考词表标签",
    detail: "导入源标记为高考词汇，说明它也出现在基础考试词表中。",
  },
  zk: {
    label: "中考词表标签",
    detail: "导入源标记为中考词汇，优先级会更靠前。",
  },
  ky: {
    label: "考研词表标签",
    detail: "导入源标记为考研词汇，可作为四六级进阶备考参考。",
  },
  toefl: {
    label: "TOEFL 标签",
    detail: "导入源标记为 TOEFL 相关词汇。",
  },
  ielts: {
    label: "IELTS 标签",
    detail: "导入源标记为 IELTS 相关词汇。",
  },
  gre: {
    label: "GRE 标签",
    detail: "导入源标记为 GRE 相关词汇；单独命中时不会被当作四六级高频。",
  },
};

export function buildVocabularyEvidence(card: VocabularyCard): VocabularyEvidence {
  const sourceBadges = buildSourceBadges(card);
  const recommendationBadges = buildRecommendationBadges(card);
  const tagLabels = getSourceTagLabels(card.tags);
  const coreScore = getCoreVocabularyScore(card);
  const examScore = getExamFocusVocabularyScore(card);
  const meta = getStudyLevelMeta(card.level);
  const reason = buildReason(card, tagLabels, coreScore, examScore);

  return {
    sourceBadges,
    recommendationBadges,
    reason,
    caution: meta.language === "ja"
      ? "JLPT 官方不发布词汇表；这里使用社区参考词表和词条等级标签，不等同于官方考试范围。"
      : "常考词基于导入源的考试标签和词条特征排序，不等同于真题频次统计。",
  };
}

export function getSourceTagLabels(tags: string[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const tag of tags) {
    const source = englishExamSourceTags[tag.trim().toLowerCase()];
    if (!source || seen.has(source.label)) continue;
    seen.add(source.label);
    labels.push(source.label);
  }

  return labels;
}

function buildSourceBadges(card: VocabularyCard): VocabularySourceBadge[] {
  const badges: VocabularySourceBadge[] = [];
  const seen = new Set<string>();

  for (const tag of card.tags) {
    const source = englishExamSourceTags[tag.trim().toLowerCase()];
    if (!source || seen.has(source.label)) continue;
    seen.add(source.label);
    badges.push(source);
  }

  const meta = getStudyLevelMeta(card.level);
  if (meta.language === "ja") {
    badges.unshift({
      label: `${meta.label} 参考词表`,
      detail: "来自 JLPT 社区参考词库和 JMdict 对齐数据。",
    });
  }

  if (!badges.length) {
    badges.push({
      label: `${meta.label} 词库`,
      detail: "来自当前等级导入词库，暂未带额外考试来源标签。",
    });
  }

  return badges;
}

function buildRecommendationBadges(card: VocabularyCard): string[] {
  const badges: string[] = [];
  if (isCoreVocabularyCard(card)) badges.push("核心词");
  if (isExamFocusVocabularyCard(card)) badges.push("常考词");
  return badges;
}

function buildReason(card: VocabularyCard, tagLabels: string[], coreScore: number, examScore: number): string {
  const isCore = isCoreVocabularyCard(card);
  const isExam = isExamFocusVocabularyCard(card);
  const meta = getStudyLevelMeta(card.level);

  if (isExam && tagLabels.length >= 2) {
    return `命中 ${tagLabels.length} 个来源标签：${tagLabels.join(" / ")}；常考优先分 ${examScore}，适合先刷。`;
  }

  if (isExam && tagLabels.length === 1) {
    return `命中来源标签：${tagLabels[0]}；常考优先分 ${examScore}，用于考试语境优先复习。`;
  }

  if (isExam && meta.language === "ja") {
    return `位于 ${meta.label} 参考词表，并符合基础等级、词形长度或假名词优先规则；常考优先分 ${examScore}。`;
  }

  if (isCore) {
    return `核心优先分 ${coreScore}：基础词性、较短词形或句子骨架词会更早推送。`;
  }

  return `暂未进入核心或常考优先队列；仍保留在 ${meta.label} 词库中按普通学习计划推进。`;
}
