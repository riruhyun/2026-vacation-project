import { describe, expect, it } from "vitest";
import {
  matchCollectionCard,
  type CollectionCard,
  type CollectionCardMatcher,
} from "@/lib/collection-card-matching";

const CARDS: CollectionCard[] = [
  {
    id: 14,
    displayName: "민들레",
    scientificName: "Taraxacum",
    stage: 1,
    rarity: "common",
    representativePlantPilbkNo: "30161",
    genusName: "Taraxacum",
    genusKoreanName: "민들레속",
  },
  {
    id: 45,
    displayName: "벌개미취",
    scientificName: "Aster koraiensis",
    stage: 3,
    rarity: "rare",
    representativePlantPilbkNo: null,
    genusName: "Aster",
    genusKoreanName: null,
  },
];

const MATCHERS: CollectionCardMatcher[] = [
  {
    collectionCardId: 14,
    taxonRank: "genus",
    normalizedTaxonName: "taraxacum",
  },
  {
    collectionCardId: 45,
    taxonRank: "species",
    normalizedTaxonName: "aster koraiensis",
  },
];

describe("matchCollectionCard", () => {
  it("uses an exact species matcher before a genus matcher", () => {
    const result = matchCollectionCard(
      CARDS,
      MATCHERS,
      "Aster koraiensis",
      "Taraxacum",
    );

    expect(result).toEqual({ card: CARDS[1], matchType: "species" });
  });

  it("maps an unknown Taraxacum species to the dandelion genus card", () => {
    const result = matchCollectionCard(
      CARDS,
      MATCHERS,
      "Taraxacum matthamense",
      "Taraxacum",
    );

    expect(result).toEqual({ card: CARDS[0], matchType: "genus" });
  });

  it("returns no collection match for an uncurated taxon", () => {
    expect(
      matchCollectionCard(CARDS, MATCHERS, "Bellis perennis", "Bellis"),
    ).toBeNull();
  });
});
