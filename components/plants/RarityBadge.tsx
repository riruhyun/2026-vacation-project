import { RARITY_LABEL } from "@/types/domain";
import type { RarityCode } from "@/types/domain";

interface RarityBadgeProps {
  rarity: RarityCode;
  size?: "sm" | "md";
}

const RARITY_CLASS: Record<RarityCode, string> = {
  common: "bg-[var(--color-rarity-common-surface)]",
  uncommon: "bg-[var(--color-rarity-uncommon-surface)]",
  rare: "bg-[var(--color-rarity-rare-surface)]",
};

export default function RarityBadge({ rarity, size = "sm" }: RarityBadgeProps) {
  return (
    <span
      className={`inline-block rounded-[var(--radius-pill)] font-semibold leading-none text-[var(--color-primary-strong)] ${RARITY_CLASS[rarity]} ${size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm"}`}
    >
      {RARITY_LABEL[rarity]}
    </span>
  );
}
