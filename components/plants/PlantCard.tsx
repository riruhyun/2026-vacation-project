// 공통 컴포넌트: 식물 카드
// 홈의 "최근 수집", 도감의 그리드에서 재사용
// 미획득 식물은 실루엣(placeholder) 처리를 위해 isLocked prop 사용

import Link from "next/link";
import { RARITY_LABEL } from "../../types/domain";
import type { PlantSlug, RarityCode } from "../../types/domain";
import { PlantPlaceholder } from "../ui/PlantPlaceholder";

interface PlantCardProps {
  slug: PlantSlug;
  koreanName: string;
  rarity: RarityCode;
  observationCount?: number; // 있으면 "흔함 · N회" 형태로 표시
  imageUrl?: string;
  isLocked?: boolean; // true면 실루엣 표시 (미획득)
  href?: string; // 지정하지 않으면 /plants/[slug]로 이동
}

export default function PlantCard({
  slug,
  koreanName,
  rarity,
  observationCount,
  imageUrl,
  isLocked = false,
  href,
}: PlantCardProps) {
  const link = href ?? `/plants/${slug}`;

  const content = (
    <div className="rounded-2xl bg-[var(--color-white)] p-3">
      <div className="flex h-[98px] w-full items-center justify-center overflow-hidden rounded-xl bg-[#EEF3EA]">
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
          <PlantPlaceholder />
        )}
      </div>

      <div className="mt-3">
        <p
          className={
            isLocked
              ? "m-0 text-sm font-semibold text-[var(--color-sub)]"
              : "m-0 text-sm font-semibold text-[var(--color-text)]"
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