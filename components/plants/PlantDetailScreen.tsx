import PageHeader from "@/components/layout/PageHeader";
import { RARITY_LABEL } from "@/types/domain";
import type { CollectedPlant, PlantSpecies } from "@/types/plant";
import type { RarityCode } from "@/types/domain";

interface PlantDetailScreenProps {
  species: PlantSpecies;
  collected: CollectedPlant | undefined;
  formattedDate: string | null;
  imageUrl: string;
}

const RARITY_BADGE_BG: Record<RarityCode, string> = {
  common: "var(--color-lime)",
  uncommon: "var(--color-sun)",
  rare: "#C3D9CE",
};

export default function PlantDetailScreen({
  species,
  collected,
  formattedDate,
  imageUrl,
}: PlantDetailScreenProps) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={species.koreanName}
        subtitle={
          formattedDate
            ? `${formattedDate} 첫 발견 · 관찰 ${collected!.observationCount}회`
            : undefined
        }
        showBack
      />

      <div className="h-[276px] w-full overflow-hidden rounded-[20px] bg-[#DCECE2]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={species.koreanName} className="h-full w-full object-cover" />
      </div>

      <span
        style={{ background: RARITY_BADGE_BG[species.rarity] }}
        className="inline-block w-fit rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--color-deep)]"
      >
        {RARITY_LABEL[species.rarity]}
      </span>

      <div>
        <h2 className="m-0 text-[28px] font-bold text-[var(--color-deep)]">
          {species.koreanName}
        </h2>
        <p className="m-0 mt-1 text-sm font-normal text-[var(--color-sub)]">
          {species.scientificName}
        </p>
      </div>

      <div className="rounded-[20px] bg-[var(--color-white)] p-[18px]">
        <p className="m-0 text-sm font-bold text-[var(--color-text)]">주요 특징</p>
        <p className="m-0 mt-2 text-sm font-normal leading-relaxed text-[var(--color-sub)]">
          {species.description}
        </p>
      </div>

      <div className="rounded-[14px] bg-[#EEF3EA] px-[18px] py-3.5">
        <p className="m-0 text-xs font-medium leading-relaxed text-[var(--color-sub)]">
          AI 식별 결과는 틀릴 수 있어요. 식용·약용 판단에 사용하지 마세요.
        </p>
      </div>
    </div>
  );
}
