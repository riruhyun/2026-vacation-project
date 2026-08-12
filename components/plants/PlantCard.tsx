// 공통 컴포넌트: 식물 카드
// 홈의 "최근 수집"(sm), 도감의 그리드(lg)에서 재사용
// 미획득 식물은 실루엣(placeholder) 처리를 위해 isLocked prop 사용

import Link from "next/link";
import { RARITY_LABEL } from "@/types/domain";
import type { PlantSlug, RarityCode } from "@/types/domain";

type PlantCardSize = "sm" | "lg";

interface PlantCardProps {
  slug: PlantSlug;
  koreanName: string;
  rarity: RarityCode;
  observationCount?: number; // 있으면 "흔함 · N회" 형태로 표시
  imageUrl?: string;
  isLocked?: boolean; // true면 실루엣 표시 (미획득)
  href?: string; // 지정하지 않으면 /plants/[slug]로 이동
  size?: PlantCardSize; // sm: 홈 최근 수집(기존), lg: 도감 그리드(158x190)
}

interface PlantCardSizeStyle {
  card: string;
  imageWrap: string;
  name: string;
}

const SIZE_STYLE: Record<PlantCardSize, PlantCardSizeStyle> = {
  sm: {
    card: "rounded-2xl bg-[var(--color-white)] p-3",
    imageWrap: "h-[98px] w-full rounded-xl",
    name: "text-sm",
  },
  lg: {
    card: "w-full rounded-2xl bg-[var(--color-white)] p-3",
    imageWrap: "aspect-[142/126] w-full rounded-xl",
    name: "text-sm",
  },
};

export default function PlantCard({
  slug,
  koreanName,
  rarity,
  observationCount,
  imageUrl,
  isLocked = false,
  href,
  size = "sm",
}: PlantCardProps) {
  const link = href ?? `/plants/${slug}`;
  const style = SIZE_STYLE[size];

  const content = (
    <div className={style.card}>
      <div
        className={`flex items-center justify-center overflow-hidden bg-[#EEF3EA] ${style.imageWrap}`}
      >
        {isLocked ? (
          // 미획득 식물: 실루엣 아이콘
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3C12 3 8 7 8 12C8 16 10 19 12 21C14 19 16 16 16 12C16 7 12 3 12 3Z"
              fill="#c9c6ba"
            />
          </svg>
        ) : imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={koreanName}
            className="h-full w-full object-cover"
          />
        ) : (
          <PlaceholderPlantIcon />
        )}
      </div>

      <div className="mt-3">
        <p
          className={
            isLocked
              ? `m-0 font-semibold text-[var(--color-sub)] ${style.name}`
              : `m-0 font-semibold text-[var(--color-text)] ${style.name}`
          }
        >
          {isLocked ? "???" : koreanName}
        </p>
        {!isLocked && (
          <p className="m-0 mt-0.5 text-xs font-normal text-[var(--color-sub)]">
            {RARITY_LABEL[rarity]}
            {typeof observationCount === "number" && ` · ${observationCount}회`}
          </p>
        )}
      </div>
    </div>
  );

  if (isLocked) {
    // 미획득 카드는 상세 페이지로 이동시키지 않음
    return <div>{content}</div>;
  }

  return <Link href={link}>{content}</Link>;
}

// 기본 식물 아이콘
function PlaceholderPlantIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 56 56" fill="none">
      <path
        d="M28 50V26"
        stroke="var(--color-primary)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="20" cy="30" rx="8" ry="5" fill="var(--color-primary)" opacity="0.7" />
      <ellipse cx="36" cy="24" rx="8" ry="5" fill="var(--color-primary)" opacity="0.7" />
      <circle cx="28" cy="14" r="9" fill="#f2b5c4" />
      <circle cx="20" cy="18" r="6" fill="#f6cfd8" />
      <circle cx="36" cy="18" r="6" fill="#f6cfd8" />
    </svg>
  );
}