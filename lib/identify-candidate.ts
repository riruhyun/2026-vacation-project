import type {
  CandidateCardViewModel,
  IdentifyCandidateDto,
} from "@/types/identify";

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isIdentifyCandidateDto(value: unknown): value is IdentifyCandidateDto {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    (typeof candidate.plantId === "number" || candidate.plantId === null) &&
    typeof candidate.official === "boolean" &&
    (candidate.matchType === "exact" || candidate.matchType === null) &&
    typeof candidate.koreanName === "string" &&
    isNullableString(candidate.description) &&
    typeof candidate.scientificName === "string" &&
    typeof candidate.scientificNameWithAuthor === "string" &&
    isNullableString(candidate.family) &&
    typeof candidate.score === "number" &&
    (candidate.stage === 1 ||
      candidate.stage === 2 ||
      candidate.stage === 3 ||
      candidate.stage === null) &&
    (candidate.rarity === "common" ||
      candidate.rarity === "uncommon" ||
      candidate.rarity === "rare" ||
      candidate.rarity === null) &&
    isNullableString(candidate.imageUrl) &&
    isNullableString(candidate.imageAttribution)
  );
}

export function toCandidateCardViewModel(
  candidate: IdentifyCandidateDto,
): CandidateCardViewModel {
  return {
    id:
      candidate.plantId === null
        ? `taxon:${candidate.scientificName}`
        : `plant:${candidate.plantId}`,
    name: candidate.koreanName,
    confidence: Math.round(Math.min(Math.max(candidate.score, 0), 1) * 100),
    description: candidate.scientificName,
    imageUrl: candidate.imageUrl,
    candidate,
  };
}

export function isCandidateCardViewModel(
  value: unknown,
): value is CandidateCardViewModel {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.confidence === "number" &&
    typeof candidate.description === "string" &&
    isNullableString(candidate.imageUrl) &&
    isIdentifyCandidateDto(candidate.candidate)
  );
}
