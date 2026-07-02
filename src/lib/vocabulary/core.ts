import type { StudyLevel, VocabularyCard } from "./types";

const coreThreshold = 22;
const examFocusThreshold = 24;

const sourceLimits: Record<StudyLevel, number> = {
  CET4: 900,
  CET6: 850,
  N5: 420,
  N4: 440,
  N3: 560,
  N2: 620,
  N1: 720,
};

const examFocusSourceLimits: Record<StudyLevel, number> = {
  CET4: 420,
  CET6: 380,
  N5: 260,
  N4: 220,
  N3: 240,
  N2: 260,
  N1: 280,
};

const japaneseLevelScore: Record<StudyLevel, number> = {
  CET4: 0,
  CET6: 0,
  N5: 70,
  N4: 55,
  N3: 38,
  N2: 22,
  N1: 12,
};

const sentenceSkeletonWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "be",
  "but",
  "by",
  "can",
  "do",
  "for",
  "from",
  "get",
  "go",
  "have",
  "he",
  "her",
  "his",
  "I",
  "in",
  "is",
  "it",
  "make",
  "not",
  "of",
  "on",
  "or",
  "she",
  "so",
  "take",
  "that",
  "the",
  "they",
  "this",
  "to",
  "we",
  "with",
  "you",
  "ある",
  "いる",
  "する",
  "です",
  "ます",
  "ない",
  "こと",
  "もの",
  "これ",
  "それ",
  "あれ",
  "ここ",
  "そこ",
  "どう",
  "なる",
]);

export function getCoreSourceLevels(level: StudyLevel): StudyLevel[] {
  if (level === "CET4") return ["CET4"];
  if (level === "CET6") return ["CET4", "CET6"];

  const jlptOrder: StudyLevel[] = ["N5", "N4", "N3", "N2", "N1"];
  return jlptOrder.slice(0, jlptOrder.indexOf(level) + 1);
}

export function getCoreSourceLimit(level: StudyLevel): number {
  return sourceLimits[level];
}

export function getExamFocusSourceLimit(level: StudyLevel): number {
  return examFocusSourceLimits[level];
}

export function isCoreVocabularyCard(card: VocabularyCard): boolean {
  return getCoreVocabularyScore(card) >= coreThreshold;
}

export function isExamFocusVocabularyCard(card: VocabularyCard): boolean {
  return getExamFocusVocabularyScore(card) >= examFocusThreshold;
}

export function compareCoreVocabulary(a: VocabularyCard, b: VocabularyCard): number {
  return getCoreVocabularyScore(b) - getCoreVocabularyScore(a)
    || a.word.localeCompare(b.word, "zh-CN")
    || a.id.localeCompare(b.id);
}

export function compareExamFocusVocabulary(a: VocabularyCard, b: VocabularyCard): number {
  return getExamFocusVocabularyScore(b) - getExamFocusVocabularyScore(a)
    || a.word.localeCompare(b.word, "zh-CN")
    || a.id.localeCompare(b.id);
}

export function getCoreVocabularyScore(card: VocabularyCard): number {
  const word = card.word.trim();
  const normalizedWord = word.toLowerCase();
  const tags = new Set(card.tags.map((tag) => tag.toLowerCase()));
  const part = card.partOfSpeech.toLowerCase();
  const isEnglish = card.level === "CET4" || card.level === "CET6";
  let score = 0;

  if (sentenceSkeletonWords.has(word) || sentenceSkeletonWords.has(normalizedWord)) score += 42;

  if (isEnglish) {
    if (tags.has("zk")) score += 30;
    if (tags.has("gk")) score += 24;
    if (tags.has("cet4")) score += 12;
    if (tags.has("cet6")) score += 6;
    if (part.includes("article") || part.includes("pronoun") || part.includes("preposition") || part.includes("conjunction")) score += 34;
    if (part.includes("verb")) score += 24;
    if (part.includes("adverb")) score += 16;
    if (part.includes("adjective")) score += 10;
    if (part.includes("noun")) score += 6;
    if (normalizedWord.length <= 4) score += 12;
    else if (normalizedWord.length <= 7) score += 7;
    if (tags.has("gre") && !tags.has("gk") && !tags.has("zk")) score -= 12;
    return score;
  }

  score += japaneseLevelScore[card.level];
  if (word.length <= 2) score += 14;
  else if (word.length <= 4) score += 8;
  if (word.match(/^[ぁ-ん]+$/)) score += 8;
  if (word.match(/^[ァ-ンー]+$/)) score -= 8;
  return score;
}

export function getExamFocusVocabularyScore(card: VocabularyCard): number {
  const word = card.word.trim();
  const normalizedWord = word.toLowerCase();
  const tags = new Set(card.tags.map((tag) => tag.toLowerCase()));
  const part = card.partOfSpeech.toLowerCase();
  const isEnglish = card.level === "CET4" || card.level === "CET6";
  let score = 0;

  if (sentenceSkeletonWords.has(word) || sentenceSkeletonWords.has(normalizedWord)) score += 48;

  if (isEnglish) {
    if (tags.has("zk")) score += 18;
    if (tags.has("gk")) score += 16;
    if (tags.has("cet4")) score += 10;
    if (tags.has("cet6")) score += 10;
    if (tags.has("ky")) score += 8;
    if (tags.has("toefl")) score += 6;
    if (tags.has("ielts")) score += 6;
    if (tags.has("gre")) score += 3;
    if (part.includes("article") || part.includes("pronoun") || part.includes("preposition") || part.includes("conjunction")) score += 12;
    if (part.includes("verb")) score += 8;
    if (part.includes("adverb")) score += 5;
    if (part.includes("adjective") || part.includes("noun")) score += 3;
    if (tags.has("gre") && !tags.has("gk") && !tags.has("zk") && !tags.has("cet4")) score -= 16;
    return score;
  }

  score += Math.max(japaneseLevelScore[card.level] - 12, 0);
  if (word.length <= 2) score += 12;
  else if (word.length <= 4) score += 8;
  if (word.match(/^[ぁ-ん]+$/)) score += 6;
  if (word.match(/^[ァ-ンー]+$/)) score -= 8;
  return score;
}
