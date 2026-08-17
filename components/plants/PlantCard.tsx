import { RiQuestionMark } from "@remixicon/react";
import Link from "next/link";
import type { RarityCode } from "@/types/domain";
import { PlantPlaceholder } from "@/components/ui/PlantPlaceholder";
import RarityBadge from "./RarityBadge";

type PlantCardSize = "sm" | "lg";

interface PlantCardProps {
  id?: number;
  koreanName: string;
  scientificName?: string;
  rarity?: RarityCode;
  observationCount?: number;
  imageUrl?: string;
  isLocked?: boolean;
  href?: string;
  size?: PlantCardSize;
}

interface PlantCardSizeStyle {
  card: string;
  imageWrap: string;
  name: string;
}

const SIZE_STYLE: Record<PlantCardSize, PlantCardSizeStyle> = {
  sm: {
    card: "rounded-[var(--radius-card)] bg-[var(--color-surface)] p-3",
    imageWrap: "h-[98px] w-full rounded-xl",
    name: "text-sm",
  },
  lg: {
    card: "w-full rounded-[var(--radius-card)] bg-[var(--color-surface)] p-3",
    imageWrap: "aspect-[142/126] w-full rounded-xl",
    name: "text-sm",
  },
};

export default function PlantCard({
  id,
  koreanName,
  scientificName,
  rarity,
  observationCount,
  imageUrl,
  isLocked = false,
  href,
  size = "sm",
}: PlantCardProps) {
  const link = href ?? (id !== undefined ? `/plants/${id}` : undefined);
  const sizeStyle = SIZE_STYLE[size];

  const content = (
    <div className={sizeStyle.card}>
      <div
        className={`flex items-center justify-center overflow-hidden bg-[var(--color-info-surface)] ${sizeStyle.imageWrap}`}
      >
        {isLocked ? (
          <span aria-label="아직 수집하지 않은 식물 사진" role="img">
            <RiQuestionMark size={40} className="text-[var(--color-text-muted)]" />
          </span>
        ) : imageUrl ? (
          // User uploads and PlantNet images can be data or remote URLs.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={koreanName}
            className="h-full w-full object-cover"
          />
        ) : (
          <PlantPlaceholder size={40} ariaLabel={`${koreanName} 사진 없음`} />
        )}
      </div>

      <div className="mt-3">
        <p
          className={`m-0 font-semibold ${isLocked ? "text-[var(--color-text-muted)]" : "text-[var(--color-text)]"} ${sizeStyle.name}`}
        >
          {koreanName}
        </p>
        {!isLocked && rarity && (
          <div className="mt-1 flex items-center gap-1.5">
            <RarityBadge rarity={rarity} />
            {typeof observationCount === "number" && (
              <span className="text-xs font-normal text-[var(--color-text-muted)]">
                {observationCount}회
              </span>
            )}
          </div>
        )}
        {!isLocked && !rarity && scientificName && (
          <div className="mt-0.5 text-xs font-normal text-[var(--color-text-muted)]">
            <p className="truncate">{scientificName}</p>
            {typeof observationCount === "number" ? <p className="mt-1">관찰 {observationCount}회</p> : null}
          </div>
        )}
      </div>
    </div>
  );

  if (isLocked || !link) {
    return <div>{content}</div>;
  }

  return <Link href={link}>{content}</Link>;
}
