// 공통 컴포넌트: 식물 카드
// 홈의 "최근 수집", 도감의 그리드에서 재사용
// 미획득 식물은 실루엣(placeholder) 처리를 위해 isLocked prop 사용

import Link from "next/link";
import type { Rarity } from "@/types/plant";

interface PlantCardProps {
  speciesId: string;
  koreanName: string;
  rarity: Rarity;
  observationCount?: number; // 있으면 "흔함 · N회" 형태로 표시
  imageUrl?: string;
  isLocked?: boolean; // true면 실루엣 표시 (미획득)
  href?: string; // 지정하지 않으면 /plants/[speciesId]로 이동
}

// 희귀도별 카드 배경 톤
const CARD_BG: Record<Rarity, string> = {
  흔함: "var(--color-mint-100)",
  보통: "var(--color-cream-100)",
  드묾: "var(--color-blush-100)",
};

export default function PlantCard({
  speciesId,
  koreanName,
  rarity,
  observationCount,
  imageUrl,
  isLocked = false,
  href,
}: PlantCardProps) {
  const link = href ?? `/plants/${speciesId}`;

  const content = (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div
        style={{
          aspectRatio: "1 / 1",
          borderRadius: "var(--radius-card)",
          background: isLocked ? "#eceae3" : CARD_BG[rarity],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {isLocked ? (
          // 미획득 식물: 실루엣 아이콘
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
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
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <PlaceholderPlantIcon />
        )}
      </div>

      <div>
        <p
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: isLocked ? "var(--color-text-muted)" : "var(--color-text-primary)",
            margin: 0,
          }}
        >
          {isLocked ? "???" : koreanName}
        </p>
        {!isLocked && (
          <p
            style={{
              fontSize: "13px",
              color: "var(--color-text-secondary)",
              margin: "2px 0 0",
            }}
          >
            {rarity}
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

// 임시 이미지 대신 사용하는 기본 식물 아이콘 (임시 데이터 단계용)
function PlaceholderPlantIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <path
        d="M28 50V26"
        stroke="var(--color-deep-green)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="20" cy="30" rx="8" ry="5" fill="var(--color-deep-green)" opacity="0.7" />
      <ellipse cx="36" cy="24" rx="8" ry="5" fill="var(--color-deep-green)" opacity="0.7" />
      <circle cx="28" cy="14" r="9" fill="#f2b5c4" />
      <circle cx="20" cy="18" r="6" fill="#f6cfd8" />
      <circle cx="36" cy="18" r="6" fill="#f6cfd8" />
    </svg>
  );
}
