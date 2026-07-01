import cet4Cards from "../../../data/vocabulary/cet-4.json";
import cet6Cards from "../../../data/vocabulary/cet-6.json";
import n1Cards from "../../../data/vocabulary/jlpt-n1.json";
import n2Cards from "../../../data/vocabulary/jlpt-n2.json";
import n3Cards from "../../../data/vocabulary/jlpt-n3.json";
import n4Cards from "../../../data/vocabulary/jlpt-n4.json";
import n5Cards from "../../../data/vocabulary/jlpt-n5.json";
import type { StudyLevel, VocabularyCard } from "./types";

export type StudyLevelMeta = {
  value: StudyLevel;
  label: string;
  shortLabel: string;
  family: string;
  language: "en" | "ja";
  readingLabel: string;
  exampleLabel: string;
};

export const studyLevels: StudyLevelMeta[] = [
  {
    value: "CET4",
    label: "CET-4",
    shortLabel: "CET-4",
    family: "英语四级",
    language: "en",
    readingLabel: "发音",
    exampleLabel: "英文例句",
  },
  {
    value: "CET6",
    label: "CET-6",
    shortLabel: "CET-6",
    family: "英语六级",
    language: "en",
    readingLabel: "发音",
    exampleLabel: "英文例句",
  },
  {
    value: "N5",
    label: "JLPT N5",
    shortLabel: "N5",
    family: "日语 N5",
    language: "ja",
    readingLabel: "假名",
    exampleLabel: "日语例句",
  },
  {
    value: "N4",
    label: "JLPT N4",
    shortLabel: "N4",
    family: "日语 N4",
    language: "ja",
    readingLabel: "假名",
    exampleLabel: "日语例句",
  },
  {
    value: "N3",
    label: "JLPT N3",
    shortLabel: "N3",
    family: "日语 N3",
    language: "ja",
    readingLabel: "假名",
    exampleLabel: "日语例句",
  },
  {
    value: "N2",
    label: "JLPT N2",
    shortLabel: "N2",
    family: "日语 N2",
    language: "ja",
    readingLabel: "假名",
    exampleLabel: "日语例句",
  },
  {
    value: "N1",
    label: "JLPT N1",
    shortLabel: "N1",
    family: "日语 N1",
    language: "ja",
    readingLabel: "假名",
    exampleLabel: "日语例句",
  },
];

const levelMetaByValue = new Map(studyLevels.map((level) => [level.value, level]));

export const vocabularyCards = [...cet4Cards, ...cet6Cards, ...n5Cards, ...n4Cards, ...n3Cards, ...n2Cards, ...n1Cards] as VocabularyCard[];

export function getVocabularyByLevel(level: StudyLevel | "all" = "all"): VocabularyCard[] {
  if (level === "all") return vocabularyCards;
  return vocabularyCards.filter((card) => card.level === level);
}

export function getStudyLevelMeta(level: StudyLevel): StudyLevelMeta {
  return levelMetaByValue.get(level) ?? studyLevels[0];
}

export function getVocabularyById(id: string): VocabularyCard | undefined {
  return vocabularyCards.find((card) => card.id === id);
}

export function getVocabularyTags(cards: VocabularyCard[] = vocabularyCards): string[] {
  return Array.from(new Set(cards.flatMap((card) => card.tags))).sort();
}

export function getPartsOfSpeech(cards: VocabularyCard[] = vocabularyCards): string[] {
  return Array.from(new Set(cards.map((card) => card.partOfSpeech))).sort();
}
