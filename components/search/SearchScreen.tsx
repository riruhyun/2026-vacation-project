"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RiCloseLine } from "@remixicon/react";
import PageHeader from "@/components/layout/PageHeader";
import PlantCard from "@/components/plants/PlantCard";
import Button from "@/components/ui/Button";
import { getMockObservationResult } from "@/lib/data";
import { readIdentifyDraft, writeIdentifyResult } from "@/lib/identify-storage";
import type { CollectionPlantDto } from "@/types/plant";

export default function SearchScreen({
  plants,
  mode,
}: {
  plants: CollectionPlantDto[];
  mode: "catalog" | "identify";
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return plants;
    return plants.filter(
      (plant) =>
        plant.koreanName.toLowerCase().includes(normalized) ||
        plant.scientificName.toLowerCase().includes(normalized),
    );
  }, [plants, query]);

  async function continueIdentify() {
    if (isSaving) return;
    const plant = plants.find(({ id }) => id === selectedId);
    if (!plant) return;
    const draft = readIdentifyDraft();
    if (!draft) {
      router.push("/capture");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const result = await getMockObservationResult({
        plantId: plant.id,
        official: true,
        koreanName: plant.koreanName,
        scientificName: plant.scientificName,
        stage: plant.stage,
      });
      if (!writeIdentifyResult(result)) {
        setError("관찰 결과를 임시 저장하지 못했어요. 저장 공간을 확인하고 다시 시도해 주세요.");
        setIsSaving(false);
        return;
      }
      router.push("/identify?step=result");
    } catch {
      setError("관찰 결과를 만들지 못했어요. 다시 시도해 주세요.");
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={mode === "identify" ? "식물 직접 선택" : "도감 검색"}
        subtitle={mode === "identify" ? "후보가 없다면 공식 50종에서 선택하세요." : "공식 50종의 이름과 학명으로 찾아보세요."}
        showBack
      />

      <div className="relative">
        <label htmlFor="plant-search" className="sr-only">식물 이름 또는 학명 검색</label>
        <input
          id="plant-search"
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

      <p className="text-sm font-bold text-[var(--color-text)]">검색 결과 {results.length}개</p>
      <div className="grid grid-cols-2 gap-4">
        {results.map((plant) => {
          const selectable = mode === "identify";
          const card = (
            <PlantCard
              id={selectable ? undefined : plant.id}
              koreanName={plant.koreanName}
              scientificName={plant.scientificName}
              rarity={plant.rarity}
              imageUrl={plant.representativeImageUrl ?? undefined}
              isLocked={!plant.collected && !selectable}
              href={!selectable && plant.collected ? `/plants/${plant.id}` : undefined}
              size="lg"
            />
          );

          return selectable ? (
            <button
              key={plant.id}
              type="button"
              aria-pressed={selectedId === plant.id}
              onClick={() => setSelectedId(plant.id)}
              className={`rounded-[var(--radius-card)] text-left ${selectedId === plant.id ? "ring-2 ring-[var(--color-primary)]" : ""}`}
            >
              {card}
            </button>
          ) : (
            <div key={plant.id}>{card}</div>
          );
        })}
      </div>

      {mode === "identify" ? (
        <>
          {error ? <p role="alert" className="text-center text-xs text-red-700">{error}</p> : null}
          <Button type="button" fullWidth disabled={selectedId === null || isSaving} onClick={continueIdentify}>
            {isSaving ? "기록 중…" : "선택한 식물로 기록하기"}
          </Button>
        </>
      ) : null}
    </div>
  );
}
