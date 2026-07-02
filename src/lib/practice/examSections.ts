import type { StudyLevel } from "@/lib/vocabulary/types";

export type ExamSection = {
  id: string;
  label: string;
  family: "CET" | "JLPT";
  skill: string;
  promptInstruction: string;
  outputHint: string;
};

const cetSections: ExamSection[] = [
  {
    id: "cet-vocabulary-context",
    label: "词汇语境",
    family: "CET",
    skill: "词汇语境",
    promptInstruction: "CET 词汇语境四选一：题干使用自然英文句子或短段落，必须包含 ____ 空格，重点考词义、搭配和语气。",
    outputHint: "英文语境 + ____ + 四个英文选项",
  },
  {
    id: "cet-cloze",
    label: "完形填空",
    family: "CET",
    skill: "完形填空",
    promptInstruction: "CET 完形填空四选一：题干像短文中的一句，必须包含 ____，干扰项要体现上下文逻辑、词性或搭配差别。",
    outputHint: "短文句子 + ____ + 逻辑干扰项",
  },
  {
    id: "cet-reading-meaning",
    label: "阅读词义",
    family: "CET",
    skill: "阅读词义辨析",
    promptInstruction: "CET 阅读理解词义题：给一小段原创英文语境，考查目标词在文中的含义或可替换表达，四个选项都用英文。",
    outputHint: "英文小段 + meaning closest to",
  },
  {
    id: "cet-translation-usage",
    label: "翻译表达",
    family: "CET",
    skill: "翻译表达",
    promptInstruction: "CET 翻译表达四选一：给中文语义或半句英文，考查目标词的准确英文表达、搭配或词形。",
    outputHint: "中文语义/英文半句 + 四个表达",
  },
];

const jlptSections: ExamSection[] = [
  {
    id: "jlpt-moji-goi",
    label: "文字語彙",
    family: "JLPT",
    skill: "文字・語彙",
    promptInstruction: "JLPT 文字・語彙四选一：题干使用自然日语句子，包含（　）空格，考查读音、词义、汉字或语境。",
    outputHint: "日语句子 + （　） + 四个日语选项",
  },
  {
    id: "jlpt-grammar",
    label: "文法",
    family: "JLPT",
    skill: "文法",
    promptInstruction: "JLPT 文法四选一：题干使用自然日语句子，包含（　）空格，考查接续、助词、句型或活用。",
    outputHint: "日语句子 + （　） + 接续干扰项",
  },
  {
    id: "jlpt-reading-context",
    label: "読解语境",
    family: "JLPT",
    skill: "読解语境",
    promptInstruction: "JLPT 読解语境题：给两到三句原创日语短文，考查目标词在语境中的含义或指代，四个选项用日语。",
    outputHint: "日语短文 + 语境含义四选一",
  },
  {
    id: "jlpt-paraphrase",
    label: "言い換え",
    family: "JLPT",
    skill: "言い換え",
    promptInstruction: "JLPT 言い換え四选一：围绕目标词生成同义替换或近义辨析题，不能复制真题或教材原文。",
    outputHint: "下線部の意味に近いもの",
  },
];

export function getExamSections(level: StudyLevel): ExamSection[] {
  return isJapaneseLevel(level) ? jlptSections : cetSections;
}

export function getDefaultExamSection(level: StudyLevel): ExamSection {
  return getExamSections(level)[0];
}

export function findExamSection(level: StudyLevel, id: string | undefined): ExamSection {
  return getExamSections(level).find((section) => section.id === id) ?? getDefaultExamSection(level);
}

function isJapaneseLevel(level: StudyLevel): boolean {
  return level.startsWith("N");
}
