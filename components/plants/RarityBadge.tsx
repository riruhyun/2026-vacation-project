// 공통 컴포넌트: 희귀도 배지
// 도감 카드, 식물 상세, 검색 결과 등 희귀도 표시가 필요한 모든 곳에서 재사용

import { RARITY_LABEL } from "@/types/domain";
import type { RarityCode } from "@/types/domain";

interface RarityBadgeProps {
  rarity: RarityCode;
  size?: "sm" | "md";
}

const RARITY_STYLE: Record<RarityCode, { bg: string; text: string }> = {
  common: { bg: "var(--color-rarity-common-bg)", text: "var(--color-rarity-common-text)" },
  uncommon: { bg: "var(--color-rarity-normal-bg)", text: "var(--color-rarity-normal-text)" },
  rare: { bg: "var(--color-rarity-rare-bg)", text: "var(--color-rarity-rare-text)" },
};

export default function RarityBadge({ rarity, size = "sm" }: RarityBadgeProps) {
  const style = RARITY_STYLE[rarity];
  const padding = size === "sm" ? "4px 10px" : "6px 14px";
  const fontSize = size === "sm" ? "12px" : "14px";

  return (
    <span
      style={{
        display: "inline-block",
        background: style.bg,
        color: style.text,
        borderRadius: "var(--radius-pill)",
        padding,
        fontSize,
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {RARITY_LABEL[rarity]}
    </span>
  );
}
