// 공통 컴포넌트: 희귀도 배지
// 도감 카드, 식물 상세, 검색 결과 등 희귀도 표시가 필요한 모든 곳에서 재사용

import type { Rarity } from "@/types/plant";

interface RarityBadgeProps {
    rarity: Rarity;
    size?: "sm" | "md";
}

const RARITY_STYLE: Record<Rarity, { bg: string; text: string }> = {
    흔함: { bg: "var(--color-rarity-common-bg)", text: "var(--color-rarity-common-text)" },
    보통: { bg: "var(--color-rarity-normal-bg)", text: "var(--color-rarity-normal-text)" },
    드묾: { bg: "var(--color-rarity-rare-bg)", text: "var(--color-rarity-rare-text)" },
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
            {rarity}
        </span>
    );
}