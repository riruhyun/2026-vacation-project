import { RiPlantLine } from "@remixicon/react";

export function PlantPlaceholder() {
  return (
    <span aria-label="식물 사진 자리" role="img">
      <RiPlantLine size={120} className="text-[var(--color-primary)] opacity-70" />
    </span>
  );
}
