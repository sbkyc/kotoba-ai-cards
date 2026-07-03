import type { CardProgress, ReviewRating } from "@/lib/scheduler/scheduler";
import { getVocabularyMeaningDisplay } from "@/lib/vocabulary/meaning";
import type { StudyLevel } from "@/lib/vocabulary/types";
import type { VocabularyCard } from "@/lib/vocabulary/types";

export type PracticeQuestion = {
  id: string;
  cardId: string;
  stem: string;
  options: string[];
  answer: string;
  explanation: string;
  skill: string;
  examSection?: string;
  questionType?: string;
};

export type PracticePaper = {
  kind: "practice-paper";
  title: string;
  questions: PracticeQuestion[];
};

export type PracticeReport = {
  total: number;
  correct: number;
  accuracy: number;
  ratingsByCardId: Record<string, Extract<ReviewRating, "known" | "unknown">>;
  weakQuestions: PracticeQuestion[];
  summary: string;
};

export type PracticeSessionSummary = {
  id: string;
  level: StudyLevel;
  mode?: PracticeMode;
  examSection?: string;
  title: string;
  takenAt: string;
  total: number;
  correct: number;
  accuracy: number;
  weakCardIds: string[];
  questions?: PracticeQuestion[];
  answersByQuestionId?: Record<string, string>;
};

export type WeakCardSummary = {
  id: string;
  word: string;
  kana: string;
  meaningZh: string;
};

export type MistakeBookItem = {
  card: VocabularyCard;
  wrongCount: number;
  lastQuestion?: PracticeQuestion;
  lastAnsweredAt: string;
};

type SourceOptions = {
  size: number;
  mode?: PracticeMode;
  favoriteIds?: string[];
};

type UnknownRecord = Record<string, unknown>;

export type PracticeMode = "weak" | "new" | "favorites" | "mock";

type PracticeSessionRecordInput = {
  id: string;
  level: StudyLevel;
  mode: PracticeMode;
  examSection?: string;
  paper: PracticePaper;
  report: PracticeReport;
  answersByQuestionId: Record<string, string>;
  takenAt?: Date;
};

export function buildPracticeSourceCards(
  cards: VocabularyCard[],
  progress: Record<string, CardProgress>,
  options: SourceOptions,
): VocabularyCard[] {
  const size = Math.max(0, options.size);
  const mode = options.mode ?? "weak";

  if (mode === "new") {
    return cards.filter((card) => !progress[card.id]).slice(0, size);
  }

  if (mode === "favorites") {
    const favoriteIds = new Set(options.favoriteIds ?? []);
    return cards
      .filter((card) => favoriteIds.has(card.id))
      .sort((a, b) => practicePriority(b, progress) - practicePriority(a, progress))
      .slice(0, size);
  }

  if (mode === "mock") {
    return spreadCards(cards, size);
  }

  const ranked = [...cards].sort((a, b) => practicePriority(b, progress) - practicePriority(a, progress));

  return ranked.slice(0, size);
}

export function normalizePracticePaper(payload: UnknownRecord, sourceCards: VocabularyCard[]): PracticePaper {
  const sourceById = new Map(sourceCards.map((card) => [card.id, card]));
  const rawQuestions = Array.isArray(payload.questions) ? payload.questions : [];
  const questions = rawQuestions
    .map((question, index) => normalizeQuestion(question, index, sourceById))
    .filter((question): question is PracticeQuestion => Boolean(question));

  return {
    kind: "practice-paper",
    title: stringValue(payload.title) || "专项刷题",
    questions,
  };
}

export function gradePracticeSession(
  questions: PracticeQuestion[],
  answersByQuestionId: Record<string, string>,
): PracticeReport {
  const ratingsByCardId: PracticeReport["ratingsByCardId"] = {};
  const weakQuestions: PracticeQuestion[] = [];
  let correct = 0;

  for (const question of questions) {
    const selected = answersByQuestionId[question.id];
    const isCorrect = isCorrectAnswer(selected, question);
    if (isCorrect) {
      correct += 1;
      ratingsByCardId[question.cardId] = "known";
    } else {
      ratingsByCardId[question.cardId] = "unknown";
      weakQuestions.push(question);
    }
  }

  const total = questions.length;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

  return {
    total,
    correct,
    accuracy,
    ratingsByCardId,
    weakQuestions,
    summary: buildSummary(accuracy, weakQuestions.length),
  };
}

export function buildWeakCardSummaries(
  weakQuestions: PracticeQuestion[],
  cards: VocabularyCard[],
): WeakCardSummary[] {
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  const seen = new Set<string>();

  return weakQuestions.flatMap((question) => {
    if (seen.has(question.cardId)) return [];
    const card = cardsById.get(question.cardId);
    if (!card) return [];
    seen.add(question.cardId);
    return [{
      id: card.id,
      word: card.word,
      kana: card.kana,
      meaningZh: getVocabularyMeaningDisplay(card).text,
    }];
  });
}

export function buildMistakeBook(
  sessions: PracticeSessionSummary[],
  cards: VocabularyCard[],
): MistakeBookItem[] {
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  const items = new Map<string, MistakeBookItem>();

  for (const session of sessions) {
    if (session.questions?.length) {
      for (const question of session.questions) {
        if (isCorrectAnswer(session.answersByQuestionId?.[question.id], question)) continue;
        const card = cardsById.get(question.cardId);
        if (!card) continue;
        const existing = items.get(question.cardId);
        items.set(question.cardId, {
          card,
          wrongCount: (existing?.wrongCount ?? 0) + 1,
          lastQuestion: question,
          lastAnsweredAt: session.takenAt,
        });
      }
      continue;
    }

    for (const cardId of session.weakCardIds) {
      const card = cardsById.get(cardId);
      if (!card) continue;
      const existing = items.get(cardId);
      items.set(cardId, {
        card,
        wrongCount: (existing?.wrongCount ?? 0) + 1,
        lastQuestion: existing?.lastQuestion,
        lastAnsweredAt: session.takenAt,
      });
    }
  }

  return Array.from(items.values()).sort((a, b) => (
    b.wrongCount - a.wrongCount ||
    new Date(b.lastAnsweredAt).getTime() - new Date(a.lastAnsweredAt).getTime()
  ));
}

export function buildMistakeRetakePaper(items: MistakeBookItem[], limit = 10): PracticePaper {
  return {
    kind: "practice-paper",
    title: "错题本复训",
    questions: items.slice(0, Math.max(limit, 0)).map(buildMistakeRetakeQuestion),
  };
}

export function buildPracticeSessionRecord({
  id,
  level,
  mode,
  examSection,
  paper,
  report,
  answersByQuestionId,
  takenAt = new Date(),
}: PracticeSessionRecordInput): PracticeSessionSummary {
  return {
    id,
    level,
    mode,
    examSection,
    title: paper.title,
    takenAt: takenAt.toISOString(),
    total: report.total,
    correct: report.correct,
    accuracy: report.accuracy,
    weakCardIds: report.weakQuestions.map((question) => question.cardId),
    questions: paper.questions,
    answersByQuestionId,
  };
}

function practicePriority(card: VocabularyCard, progress: Record<string, CardProgress>): number {
  const value = progress[card.id];
  if (!value) return 0;

  return value.unknownCount * 7 + value.fuzzyCount * 3 + (value.status === "learning" ? 1 : 0);
}

function spreadCards(cards: VocabularyCard[], size: number): VocabularyCard[] {
  if (size <= 0 || cards.length === 0) return [];
  if (size >= cards.length) return cards;

  const selected: VocabularyCard[] = [];
  for (let index = 0; index < size; index += 1) {
    const cardIndex = Math.round((index * (cards.length - 1)) / (size - 1));
    selected.push(cards[cardIndex]);
  }

  return selected;
}

function buildMistakeRetakeQuestion(item: MistakeBookItem, index: number): PracticeQuestion {
  const id = `mistake-${index + 1}`;
  const meaning = getVocabularyMeaningDisplay(item.card).text;
  const fallbackQuestion: PracticeQuestion = {
    id,
    cardId: item.card.id,
    stem: `「${item.card.word}」最符合哪一项释义或用法？`,
    options: [
      `A ${meaning}`,
      "B 仅表示过去时间",
      "C 只用于人名或地名",
      "D 与本词无关的干扰释义",
    ],
    answer: `A ${meaning}`,
    explanation: item.card.exampleZh || meaning,
    skill: "错题复训",
    examSection: "错题本",
    questionType: "释义辨析四选一",
  };

  if (!item.lastQuestion || item.lastQuestion.options.length !== 4) return fallbackQuestion;

  return {
    ...fallbackQuestion,
    ...item.lastQuestion,
    id,
  };
}

function normalizeQuestion(
  value: unknown,
  index: number,
  sourceById: Map<string, VocabularyCard>,
): PracticeQuestion | null {
  if (!isRecord(value)) return null;

  const cardId = stringValue(value.cardId);
  const options = Array.isArray(value.options) ? value.options.map(String).filter(Boolean) : [];
  const answer = stringValue(value.answer);
  const stem = stringValue(value.stem || value.question);
  const matchedAnswer = findMatchingOption(answer, options);

  if (!sourceById.has(cardId) || !stem || options.length !== 4 || !matchedAnswer) return null;

  return {
    id: stringValue(value.id) || `q${index + 1}`,
    cardId,
    stem,
    options,
    answer: matchedAnswer,
    explanation: stringValue(value.explanation),
    skill: stringValue(value.skill) || "词汇语境",
    examSection: stringValue(value.examSection) || undefined,
    questionType: stringValue(value.questionType) || undefined,
  };
}

function buildSummary(accuracy: number, weakCount: number): string {
  if (accuracy >= 90) return "掌握很稳，可以继续提高题速。";
  if (accuracy >= 70) return `整体不错，还有 ${weakCount} 个词需要回炉。`;
  return `这组词还不够熟，建议立刻复盘 ${weakCount} 个错题词。`;
}

export function isCorrectAnswer(selected: string | undefined, question: PracticeQuestion): boolean {
  const selectedAnswer = normalizeAnswer(selected);
  const expectedAnswer = normalizeAnswer(question.answer);
  if (!selectedAnswer || !expectedAnswer) return false;
  if (selectedAnswer === expectedAnswer) return true;

  return (
    answerPrefix(selectedAnswer) === answerPrefix(expectedAnswer) ||
    answerBody(selectedAnswer) === answerBody(expectedAnswer)
  );
}

function normalizeAnswer(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function answerPrefix(value: string): string {
  return value.match(/^[a-d](?:[.)、\s]|$)/i)?.[0].slice(0, 1).toLowerCase() ?? value;
}

function answerBody(value: string): string {
  return value.replace(/^[a-d](?:[.)、\s]+|$)/i, "").trim();
}

function findMatchingOption(answer: string, options: string[]): string | null {
  return options.find((option) => isCorrectAnswer(answer, {
    id: "answer-check",
    cardId: "",
    stem: "",
    options,
    answer: option,
    explanation: "",
    skill: "",
  })) ?? null;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}
