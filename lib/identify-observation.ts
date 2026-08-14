import { saveObservation } from "@/lib/api";
import type { IdentifyCandidateDto } from "@/types/identify";
import type { CreateObservationResponseDto } from "@/types/observation";

async function capturedFile(imageUrl: string, signal?: AbortSignal) {
  const response = await fetch(imageUrl, { signal });
  if (!response.ok) throw new Error("촬영 이미지를 불러오지 못했습니다.");

  const blob = await response.blob();
  const extension = blob.type === "image/png" ? "png" : "jpg";
  return new File([blob], `plant.${extension}`, { type: blob.type });
}

export async function resolveObservationResult(
  savedResult: CreateObservationResponseDto | null,
  candidate: IdentifyCandidateDto,
  imageUrl: string,
  signal?: AbortSignal,
): Promise<CreateObservationResponseDto> {
  if (savedResult) return savedResult;

  const image = await capturedFile(imageUrl, signal);
  signal?.throwIfAborted();

  return saveObservation(
    {
      image,
      plantId: candidate.plantId,
      scientificName: candidate.scientificName,
      genusName: candidate.genusName,
      displayName: candidate.koreanName,
      identificationScore: candidate.score,
      identificationCandidates: [
        {
          scientificName: candidate.scientificName,
          genusName: candidate.genusName,
          score: candidate.score,
        },
      ],
    },
    signal,
  );
}
