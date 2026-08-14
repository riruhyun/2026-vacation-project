import { saveObservation } from "@/lib/api";
import type { IdentifyCandidateDto } from "@/types/identify";
import type { CreateObservationResponseDto } from "@/types/observation";

async function capturedFile(imageUrl: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("촬영 이미지를 불러오지 못했습니다.");

  const blob = await response.blob();
  const extension = blob.type === "image/png" ? "png" : "jpg";
  return new File([blob], `plant.${extension}`, { type: blob.type });
}

export async function resolveObservationResult(
  savedResult: CreateObservationResponseDto | null,
  candidate: IdentifyCandidateDto,
  imageUrl: string,
): Promise<CreateObservationResponseDto> {
  if (savedResult) return savedResult;

  const image = await capturedFile(imageUrl);
  return saveObservation(
    candidate.plantId != null
      ? { image, plantId: candidate.plantId }
      : {
          image,
          plantId: null,
          scientificName: candidate.scientificName,
          displayName: candidate.koreanName,
        },
  );
}
