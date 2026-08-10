// TODO: GET /api/collection

"use client";

import { useMemo, useState } from "react";
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

export default function CollectionPage() {
    const [activeTab, setActiveTab] = useState<FilterTab>("전체");

    const collectedIds = useMemo(
        () => new Set(mockCollectedPlants.map((plant) => plant.slug)),
        []
    );

    // 공식 도감 전체(획득+미획득)를 카테고리 필터링
    const filteredSpecies = useMemo(() => {
        return mockPlantSpecies.filter(
            (species) => activeTab === "전체" || species.category === activeTab
        );
    }, [activeTab]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <PageHeader
                title="나의 식물 도감"
                action={
                    <button
                        style={{
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-pill)",
                            padding: "8px 16px",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                        onClick={() => {
                            window.location.href = "/search";
                        }}
                    >
                        검색
                    </button>
                }
            />

            <p
                style={{
                    fontSize: "13px",
                    color: "var(--color-text-secondary)",
                    margin: "-8px 0 0",
                }}
            >
                {mockCollectionSummary.totalSpeciesFound}종 발견 · 총{" "}
                {mockCollectionSummary.totalObservations}회 관찰
            </p>

            <div style={{ display: "flex", gap: "8px" }}>
                {FILTER_TABS.map((tab) => {
                    const active = tab === activeTab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: tab === "전체" ? "0 0 auto" : "1",
                                padding: "10px 0",
                                paddingLeft: tab === "전체" ? "20px" : undefined,
                                paddingRight: tab === "전체" ? "20px" : undefined,
                                borderRadius: "var(--radius-pill)",
                                border: "none",
                                background: active ? "var(--color-deep-green)" : "var(--color-surface)",
                                color: active ? "#ffffff" : "var(--color-text-secondary)",
                                fontSize: "14px",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            {tab}
                        </button>
                    );
                })}
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "14px",
                }}
            >
                {filteredSpecies.map((species) => {
                    const collected = mockCollectedPlants.find(
                        (plant) => plant.slug === species.slug
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
                        />
                    );
                })}
            </div>
        </div>
    );
}
