import { RiPlantLine } from "@remixicon/react";

interface PlantPlaceholderProps {
  size?: number;
  ariaLabel?: string;
}

export function PlantPlaceholder({
  size = 120,
  ariaLabel = "식물 사진 자리",
}: PlantPlaceholderProps) {
  return (
    <span aria-label={ariaLabel} role="img">
      <RiPlantLine size={size} className="text-[var(--color-primary)] opacity-70" />
    </span>
  );
}
