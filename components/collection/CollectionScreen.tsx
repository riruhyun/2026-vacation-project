"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import PlantCard from "@/components/plants/PlantCard";
import {
  mockCollectedPlants,
  mockCollectionSummary,
  mockPlantSpecies,
} from "@/data/mock-plants";
import type { PlantCategory } from "@/types/domain";

type FilterTab = "전체" | PlantCategory;

const FILTER_TABS: FilterTab[] = ["전체", "꽃", "풀", "나무"];

const GRID_IMAGES = [
  "/plants/example1.jpg",
  "/plants/example2.webp",
  "/plants/example3.jpg",
];

export default function CollectionScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>("전체");

  const collectedIds = useMemo(
    () => new Set(mockCollectedPlants.map((plant) => plant.slug)),
    [],
  );

  const filteredSpecies = useMemo(() => {
    return mockPlantSpecies.filter(
      (species) => activeTab === "전체" || species.category === activeTab,
    );
  }, [activeTab]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="나의 식물 도감"
        action={
          <button
            type="button"
            onClick={() => {
              router.push("/search");
            }}
            className="rounded-full bg-[var(--color-white)] px-4 py-2 text-xs font-semibold text-[var(--color-primary)]"
          >
            검색
          </button>
        }
      />

      <p className="-mt-2 text-sm text-[var(--color-sub)]">
        {mockCollectionSummary.totalSpeciesFound}종 발견 · 총{" "}
        {mockCollectionSummary.totalObservations}회 관찰
      </p>

      <div className="flex gap-2">
        {FILTER_TABS.map((tab) => {
          const active = tab === activeTab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={
                active
                  ? { background: "var(--color-primary)", color: "var(--color-white)" }
                  : { background: "var(--color-white)", color: "var(--color-sub)" }
              }
              className="flex h-[30px] w-[70px] items-center justify-center rounded-[15px] text-xs font-semibold"
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredSpecies.map((species, index) => {
          const collected = mockCollectedPlants.find(
            (plant) => plant.slug === species.slug,
          );
          const isLocked = !collectedIds.has(species.slug);

          return (
            <PlantCard
              key={species.slug}
              slug={species.slug}
              koreanName={species.koreanName}
              rarity={species.rarity}
              observationCount={collected?.observationCount}
              isLocked={isLocked}
              size="lg"
              imageUrl={isLocked ? undefined : GRID_IMAGES[index % GRID_IMAGES.length]}
            />
          );
        })}
      </div>
    </div>
  );
}
