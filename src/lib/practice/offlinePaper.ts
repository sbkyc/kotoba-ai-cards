import type { ExamSection } from "@/lib/practice/examSections";
import type { PracticePaper, PracticeQuestion } from "@/lib/practice/practice";
import type { VocabularyCard } from "@/lib/vocabulary/types";

type OfflinePaperOptions = {
  questionCount: number;
  examSection: ExamSection;
};

const optionLetters = ["A", "B", "C", "D"];

export function buildOfflinePracticePaper(
  sourceCards: VocabularyCard[],
  { questionCount, examSection }: OfflinePaperOptions,
): PracticePaper {
  const limit = Math.max(0, Math.min(questionCount, sourceCards.length));
  const selectedCards = sourceCards.slice(0, limit);

  return {
    kind: "practice-paper",
    title: `${examSection.family} ${examSection.label} · 离线小测`,
    questions: selectedCards.map((card, index) => buildOfflineQuestion(card, index, sourceCards, examSection)),
  };
}

function buildOfflineQuestion(
  card: VocabularyCard,
  index: number,
  sourceCards: VocabularyCard[],
  examSection: ExamSection,
): PracticeQuestion {
  const answerBody = optionBody(card, examSection);
  const optionBodies = buildOptionBodies(card, sourceCards, examSection);
  const { options, answer } = labelOptions(answerBody, optionBodies, index);

  return {
    id: `offline-${card.id}-${index + 1}`,
    cardId: card.id,
    stem: buildStem(card, examSection),
    options,
    answer,
    explanation: buildExplanation(card),
    skill: examSection.skill,
    examSection: `${examSection.family} ${examSection.label}`,
    questionType: "离线原创四选一",
  };
}

function buildStem(card: VocabularyCard, examSection: ExamSection): string {
  if (examSection.family === "JLPT") {
    return buildJlptStem(card, examSection);
  }

  return buildCetStem(card, examSection);
}

function buildCetStem(card: VocabularyCard, examSection: ExamSection): string {
  if (examSection.id === "cet-reading-meaning") {
    return `In the sentence "${englishExample(card)}", which meaning is closest to "${card.word}"?`;
  }

  if (examSection.id === "cet-translation-usage") {
    return `“${card.meaningZh}” is closest to which English expression?`;
  }

  const blanked = replaceWord(englishExample(card), card.word, "____");
  return blanked.includes("____")
    ? blanked
    : `Choose the word that best completes the sentence: ____ means "${card.meaningZh}".`;
}

function buildJlptStem(card: VocabularyCard, examSection: ExamSection): string {
  if (examSection.id === "jlpt-reading-context") {
    return `${japaneseExample(card)} 「${card.word}」の意味として近いものはどれですか。`;
  }

  if (examSection.id === "jlpt-paraphrase") {
    return `下線部「${card.word}」の意味に近いものはどれですか。`;
  }

  const blanked = replaceWord(japaneseExample(card), card.word, "（　）");
  return blanked.includes("（　）")
    ? blanked
    : `文の（　）に入る言葉として最もよいものを選んでください。意味：${card.meaningZh}`;
}

function buildOptionBodies(
  answerCard: VocabularyCard,
  sourceCards: VocabularyCard[],
  examSection: ExamSection,
): string[] {
  const answerBody = optionBody(answerCard, examSection);
  const bodies = sourceCards
    .filter((card) => card.id !== answerCard.id)
    .map((card) => optionBody(card, examSection));

  return uniqueBodies([
    answerBody,
    ...bodies,
    ...fallbackOptionBodies(answerCard, examSection),
  ]).slice(0, 4);
}

function optionBody(card: VocabularyCard, examSection: ExamSection): string {
  if (examSection.id === "cet-reading-meaning" || examSection.id === "jlpt-reading-context" || examSection.id === "jlpt-paraphrase") {
    return card.meaningZh;
  }

  return card.word;
}

function labelOptions(answerBody: string, optionBodies: string[], index: number): { options: string[]; answer: string } {
  const distractors = optionBodies.filter((body) => body !== answerBody);
  const answerIndex = index % optionLetters.length;
  const arrangedBodies = distractors.slice(0, 3);
  arrangedBodies.splice(answerIndex, 0, answerBody);

  const options = arrangedBodies.slice(0, 4).map((body, optionIndex) => `${optionLetters[optionIndex]} ${body}`);

  return {
    options,
    answer: options[answerIndex],
  };
}

function fallbackOptionBodies(card: VocabularyCard, examSection: ExamSection): string[] {
  if (examSection.id === "cet-reading-meaning" || examSection.id === "jlpt-reading-context" || examSection.id === "jlpt-paraphrase") {
    return [
      `只表示人名或地名`,
      `与「${card.word}」无关的固定寒暄`,
      `表示过去发生的具体日期`,
      `表示颜色或形状`,
    ];
  }

  if (examSection.family === "JLPT") {
    return ["確認", "準備", "説明", "場合", "理由"];
  }

  return ["confirm", "prepare", "explain", "reason", "method"];
}

function buildExplanation(card: VocabularyCard): string {
  const examples = [card.exampleJa, card.exampleZh].filter(Boolean).join(" ");
  return examples ? `${card.word}：${card.meaningZh}。${examples}` : `${card.word}：${card.meaningZh}。`;
}

function englishExample(card: VocabularyCard): string {
  return card.exampleJa || `The target word is ${card.word}.`;
}

function japaneseExample(card: VocabularyCard): string {
  return card.exampleJa || `${card.word}を使った文を確認します。`;
}

function replaceWord(sentence: string, word: string, replacement: string): string {
  if (!word) return sentence;
  return sentence.replace(new RegExp(escapeRegExp(word), "gi"), replacement);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uniqueBodies(values: string[]): string[] {
  const seen = new Set<string>();

  return values.flatMap((value) => {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) return [];
    seen.add(normalized);
    return [normalized];
  });
}
