import type { ObservationDto } from "@/types/observation";

type ObservationRow = {
  id: string;
  scientific_name: string;
  display_name: string;
  image_path: string;
  observed_at: string;
};

export function toObservationDto(
  observation: ObservationRow,
  imageUrl: string,
  plantId: number | null,
): ObservationDto {
  return {
    id: observation.id,
    plantId,
    scientificName: observation.scientific_name,
    displayName: observation.display_name,
    imagePath: observation.image_path,
    observedAt: observation.observed_at,
    imageUrl,
  };
}
