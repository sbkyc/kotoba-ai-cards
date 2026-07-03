import { getVocabularyMeaningSearchText } from "./meaning";
import type { VocabularyCard, VocabularyFilter } from "./types";

export function filterVocabulary(cards: VocabularyCard[], filter: VocabularyFilter): VocabularyCard[] {
  const query = filter.query?.trim().toLowerCase();

  return cards.filter((card) => {
    const matchesLevel = !filter.level || filter.level === "all" || card.level === filter.level;
    const matchesPart = !filter.partOfSpeech || card.partOfSpeech === filter.partOfSpeech;
    const matchesTag = !filter.tag || card.tags.includes(filter.tag);
    const searchableText = [
      card.word,
      card.kana,
      card.meaningZh,
      ...getVocabularyMeaningSearchText(card),
      card.partOfSpeech,
      card.exampleJa,
      card.exampleZh,
      ...card.tags,
      ...(card.relatedWords ?? []),
    ];
    const matchesQuery = !query || searchableText.some((text) => text.toLowerCase().includes(query));

    return matchesLevel && matchesPart && matchesTag && matchesQuery;
  });
}
