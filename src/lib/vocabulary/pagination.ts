export type VisibleVocabulary<T> = {
  visibleItems: T[];
  visibleCount: number;
  totalCount: number;
  hasMore: boolean;
};

export function getVisibleVocabulary<T>(items: T[], requestedCount: number): VisibleVocabulary<T> {
  const visibleCount = Math.min(Math.max(requestedCount, 0), items.length);

  return {
    visibleItems: items.slice(0, visibleCount),
    visibleCount,
    totalCount: items.length,
    hasMore: visibleCount < items.length,
  };
}
