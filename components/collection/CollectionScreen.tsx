"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import PlantCard from "@/components/plants/PlantCard";
import type { CollectionResponseDto } from "@/types/plant";

type CollectionTab = "official" | "other";

export default function CollectionScreen({ data }: { data: CollectionResponseDto }) {
  const [activeTab, setActiveTab] = useState<CollectionTab>("official");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="나의 식물 도감"
        action={
          <Link href="/search" className="rounded-full bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-primary)]">
            검색
          </Link>
        }
      />

      <p className="-mt-2 text-sm text-[var(--color-text-muted)]">
        공식 {data.summary.collected}/{data.summary.total}종 수집 · 총 {data.summary.totalObservations}회 관찰
      </p>

      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="도감 분류">
        {([
          ["official", `공식 도감 ${data.summary.total}종`],
          ["other", "기타 발견"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={activeTab === value}
            onClick={() => setActiveTab(value)}
            className={`rounded-[var(--radius-pill)] px-4 py-2 text-sm font-semibold ${
              activeTab === value
                ? "bg-[var(--color-primary)] text-[var(--color-surface)]"
                : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "official" ? (
        <div className="grid grid-cols-2 gap-4">
          {data.officialPlants.map((plant) => (
            <PlantCard
              key={plant.id}
              id={plant.id}
              koreanName={plant.koreanName}
              scientificName={plant.scientificName}
              rarity={plant.rarity}
              observationCount={plant.observationCount}
              imageUrl={plant.representativeImageUrl ?? undefined}
              isLocked={!plant.collected}
              size="lg"
            />
          ))}
        </div>
      ) : data.otherFindings.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {data.otherFindings.map((finding) => (
            <PlantCard
              key={finding.scientificName}
              koreanName={finding.displayName}
              scientificName={finding.scientificName}
              observationCount={finding.observationCount}
              imageUrl={finding.representativeImageUrl}
              href={`/findings/${encodeURIComponent(finding.scientificName)}`}
              size="lg"
            />
          ))}
        </div>
      ) : (
        <p className="rounded-[var(--radius-card)] bg-[var(--color-info-surface)] px-5 py-8 text-center text-sm text-[var(--color-text-muted)]">
          아직 기타 식물 발견 기록이 없어요.
        </p>
      )}
    </div>
  );
}
