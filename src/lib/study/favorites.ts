export function toggleFavoriteId(favorites: string[], cardId: string): string[] {
  if (favorites.includes(cardId)) {
    return favorites.filter((id) => id !== cardId);
  }

  return [...favorites, cardId];
}
