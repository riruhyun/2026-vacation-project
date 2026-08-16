"use client";

import { useState } from "react";
import { RiCloseLine } from "@remixicon/react";
import PageHeader from "@/components/layout/PageHeader";
import PlantCard from "@/components/plants/PlantCard";
import { filterCollectionItems } from "@/lib/collection-search";
import type { CollectionResponseDto } from "@/types/plant";

type CollectionTab = "official" | "other";

export default function CollectionScreen({ data }: { data: CollectionResponseDto }) {
  const [activeTab, setActiveTab] = useState<CollectionTab>("official");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const visiblePlants = filterCollectionItems(data.officialPlants, query);
  const visibleFindings = filterCollectionItems(data.otherFindings, query);
  const resultCount = activeTab === "official" ? visiblePlants.length : visibleFindings.length;

  function toggleSearch() {
    setIsSearchOpen((open) => !open);
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="나의 식물 도감"
        action={
          <button
            type="button"
            onClick={toggleSearch}
            aria-expanded={isSearchOpen}
            className="rounded-full bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-primary)]"
          >
            검색
          </button>
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

      {isSearchOpen ? (
        <>
          <div className="relative">
            <label htmlFor="collection-search" className="sr-only">식물 이름 또는 학명 검색</label>
            <input
              id="collection-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="식물 이름 또는 학명"
              className="w-full rounded-[var(--radius-card)] border border-[var(--color-primary)] bg-[var(--color-surface)] py-3.5 pl-4 pr-10 text-sm outline-none"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                <RiCloseLine size={20} />
              </button>
            ) : null}
          </div>
          <p className="text-sm font-bold text-[var(--color-text)]">검색 결과 {resultCount}개</p>
        </>
      ) : null}

      {activeTab === "official" ? (
        visiblePlants.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {visiblePlants.map((plant) => (
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
        ) : (
          <p className="rounded-[var(--radius-card)] bg-[var(--color-info-surface)] px-5 py-8 text-center text-sm text-[var(--color-text-muted)]">
            검색 결과가 없어요.
          </p>
        )
      ) : visibleFindings.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {visibleFindings.map((finding) => (
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
          {data.otherFindings.length === 0 ? "아직 기타 식물 발견 기록이 없어요." : "검색 결과가 없어요."}
        </p>
      )}
    </div>
  );
}
