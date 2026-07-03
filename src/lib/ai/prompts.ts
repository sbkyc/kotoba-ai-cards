import { getStudyLevelMeta } from "@/lib/vocabulary/data";
import type { ExamSection } from "@/lib/practice/examSections";
import { getVocabularyMeaningPromptLines } from "@/lib/vocabulary/meaning";
import type { VocabularyCard } from "@/lib/vocabulary/types";

function cardSummary(card: VocabularyCard): string {
  const meta = getStudyLevelMeta(card.level);

  return [
    `Word: ${card.word}`,
    `${meta.readingLabel}: ${card.kana}`,
    ...getVocabularyMeaningPromptLines(card),
    `Part of speech: ${card.partOfSpeech}`,
    `Level: ${meta.label}`,
    `Base example: ${card.exampleJa}`,
    `Base translation: ${card.exampleZh}`,
  ].join("\n");
}

export function buildExamplePrompt(card: VocabularyCard): string {
  const meta = getStudyLevelMeta(card.level);

  if (meta.language === "en") {
    return `你是一个帮助中文母语者备考 ${meta.label} 的英语词汇老师。

请根据下面的词汇生成一个自然、适合 ${meta.label} 难度的英文例句。

${cardSummary(card)}

只返回 JSON，不要返回 Markdown。格式：
{
  "exampleJa": "自然的英文例句",
  "exampleZh": "中文翻译",
  "usageNote": "一句中文用法提示"
}`;
  }

  return `你是一个帮助中文母语者备考 ${meta.label} 的日语老师。

请根据下面的词汇生成一个自然、适合 ${meta.label} 难度的日语例句。

${cardSummary(card)}

只返回 JSON，不要返回 Markdown。格式：
{
  "exampleJa": "自然的日语例句",
  "exampleZh": "中文翻译",
  "usageNote": "一句中文用法提示"
}`;
}

export function buildDifferencePrompt(card: VocabularyCard): string {
  const meta = getStudyLevelMeta(card.level);
  const related = card.relatedWords?.length ? card.relatedWords.join(" / ") : "没有提供近义词，请选择常见易混词";
  const subject = meta.language === "en" ? "英语近义词和易混词" : "日语近义词差别";

  return `你是一个帮助中文母语者理解${subject}的老师。

请解释当前词和相关词的区别，面向 ${meta.label} 学习者。

${cardSummary(card)}
Related words: ${related}

只返回 JSON，不要返回 Markdown。格式：
{
  "explanation": "中文解释主要差别",
  "usageComparison": "用一两句话比较使用场景",
  "commonMistake": "常见误用提醒"
}`;
}

export function buildQuizPrompt(card: VocabularyCard): string {
  const meta = getStudyLevelMeta(card.level);

  if (meta.language === "en") {
    return `你是一个熟悉 ${meta.label} 备考训练的英语命题老师。

请围绕下面的词汇生成一道原创的真题风格检测题，用来判断学习者是否真的记住词义、搭配和语境。
题型参考 CET 词汇语境题、完形填空或阅读理解中的词义辨析，但不要复制真题原文、教材原文或任何受版权保护的题目。
题干必须是自然英文语境，包含一个空格；四个选项都用英文，且干扰项要合理。
解析用中文说明为什么正确选项适合语境，并指出一个常见误选原因。

${cardSummary(card)}

只返回 JSON，不要返回 Markdown。格式：
{
  "kind": "exam-quiz",
  "examSection": "CET 词汇语境",
  "questionType": "短文空格四选一",
  "question": "英文题干，包含 ____ 空格",
  "options": ["A 英文选项", "B 英文选项", "C 英文选项", "D 英文选项"],
  "answer": "正确选项文本",
  "explanation": "中文解析",
  "memoryCheck": "根据学习者可能的误选，给一句复习建议"
}`;
  }

  return `你是一个熟悉 ${meta.label} 备考训练的日语命题老师。

请围绕下面的词汇生成一道原创的真题风格检测题，用来判断学习者是否真的记住词义、读音、语境或语法接续。
题型参考 JLPT 的 文字・語彙 和 文法 选择题，但不要复制真题原文、教材原文或任何受版权保护的题目。
题干必须是自然日语句子，使用日语考试常见的空格形式（　），四个选项都用日语。
解析用中文说明正确选项、语境线索，以及常见误选原因。

${cardSummary(card)}

只返回 JSON，不要返回 Markdown。格式：
{
  "kind": "exam-quiz",
  "examSection": "JLPT 文字・語彙 / 文法",
  "questionType": "文中の（　）に入る語を選ぶ四选一",
  "question": "日语题干，包含（　）",
  "options": ["A 日语选项", "B 日语选项", "C 日语选项", "D 日语选项"],
  "answer": "正确选项文本",
  "explanation": "中文解析",
  "memoryCheck": "根据学习者可能的误选，给一句复习建议"
}`;
}

export function buildPracticePaperPrompt(cards: VocabularyCard[], options: { questionCount: number; examSection?: ExamSection }): string {
  const firstCard = cards[0];
  const meta = firstCard ? getStudyLevelMeta(firstCard.level) : null;
  const questionCount = Math.min(Math.max(options.questionCount, 1), cards.length);
  const examStyle = options.examSection?.promptInstruction ?? (meta?.language === "ja"
    ? "JLPT 文字・語彙 / 文法 四选一，题干使用自然日语和（　）空格"
    : "CET 词汇语境 / 完形填空 / 阅读词义辨析四选一，题干使用自然英文和 ____ 空格");
  const sectionLabel = options.examSection
    ? `${options.examSection.family} ${options.examSection.label}`
    : meta?.language === "ja"
      ? "JLPT 文字・語彙 / 文法"
      : "CET 词汇语境";
  const skillLabel = options.examSection?.skill ?? (meta?.language === "ja" ? "文字・語彙" : "词汇语境");
  const source = cards.slice(0, questionCount).map((card, index) => (
    [
      `#${index + 1}`,
      `cardId: ${card.id}`,
      cardSummary(card),
      `Related: ${card.relatedWords?.join(" / ") ?? ""}`,
    ].join("\n")
  )).join("\n\n");

  return `你是一个严格的考试命题老师。请基于下面 ${questionCount} 个词生成一套原创专项小测，用来检测学习者是否真正掌握词义、搭配、语境和易混点。
考试模块：${sectionLabel}。
题型风格：${examStyle}。
要求：
1. 每个词只出 1 题，共 ${questionCount} 题。
2. 不要复制真题、教材原文或任何受版权保护的题目，所有题干必须原创。
3. 每题必须保留对应的 cardId，cardId 必须从给定词条中逐字复制。
4. 每题 4 个选项，干扰项要合理，答案必须与 options 中某一项完全一致。
5. 每题的 skill 写成「${skillLabel}」，examSection 写成「${sectionLabel}」。
6. explanation 用中文说明为什么选这个，以及常见误选原因。

词条：
${source}

可用 cardId 列表：
${cards.slice(0, questionCount).map((card) => `{"cardId": "${card.id}"}`).join("\n")}

只返回 JSON，不要返回 Markdown。格式：
{
  "kind": "practice-paper",
  "title": "专项错题训练",
  "questions": [
    {
      "id": "q1",
      "cardId": "${cards[0]?.id ?? "card-id"}",
      "examSection": "${sectionLabel}",
      "questionType": "${options.examSection?.outputHint ?? "四选一"}",
      "skill": "${skillLabel}",
      "stem": "题干",
      "options": ["A 选项", "B 选项", "C 选项", "D 选项"],
      "answer": "A 选项",
      "explanation": "中文解析"
    }
  ]
}`;
}
