export type StudyLevel = "CET4" | "CET6" | "N5" | "N4" | "N3" | "N2" | "N1";

export type VocabularyCard = {
  id: string;
  level: StudyLevel;
  word: string;
  kana: string;
  meaningZh: string;
  partOfSpeech: string;
  exampleJa: string;
  exampleZh: string;
  tags: string[];
  relatedWords?: string[];
  notes?: string;
};

export type VocabularyFilter = {
  level?: StudyLevel | "all";
  query?: string;
  partOfSpeech?: string;
  tag?: string;
  mastery?: "all" | "new" | "learning" | "known";
};
