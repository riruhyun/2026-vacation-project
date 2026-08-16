type CollectionSearchItem = {
  scientificName: string;
  koreanName?: string;
  displayName?: string;
};

export function filterCollectionItems<T extends CollectionSearchItem>(
  items: readonly T[],
  query: string,
): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...items];

  return items.filter((item) =>
    (item.koreanName ?? item.displayName ?? "").toLowerCase().includes(normalized) ||
    item.scientificName.toLowerCase().includes(normalized),
  );
}
