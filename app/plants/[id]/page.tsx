// TODO: GET /api/plants/[id]

import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import RarityBadge from "@/components/plants/RarityBadge";
import {
    getMockCollectedPlantBySpeciesId,
    getMockPlantSpeciesById,
} from "@/data/mock-plants";

interface PlantDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function PlantDetailPage({ params }: PlantDetailPageProps) {
    const { id } = await params;

    const species = getMockPlantSpeciesById(id);
    const collected = getMockCollectedPlantBySpeciesId(id);

    if (!species) {
        notFound();
    }

    const formattedDate = collected
        ? formatDate(collected.firstFoundAt)
        : null;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <PageHeader title={species.koreanName} showBack />

            {formattedDate && (
                <p
                    style={{
                        fontSize: "13px",
                        color: "var(--color-text-secondary)",
                        margin: "-8px 0 0",
                    }}
                >
                    {formattedDate} 첫 발견 · 관찰 {collected!.observationCount}회
                </p>
            )}

            {/* 대표 이미지 영역 (임시 이미지) */}
            <div
                style={{
                    aspectRatio: "1 / 1",
                    borderRadius: "var(--radius-card)",
                    background: "var(--color-mint-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <PlaceholderPlantIcon />
            </div>

            <RarityBadge rarity={species.rarity} size="md" />

            <div>
                <h2 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
                    {species.koreanName}
                </h2>
                <p
                    style={{
                        fontSize: "14px",
                        fontStyle: "italic",
                        color: "var(--color-text-secondary)",
                        margin: "4px 0 0",
                    }}
                >
                    {species.scientificName}
                </p>
            </div>

            <div
                style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-card)",
                    padding: "18px",
                }}
            >
                <p style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>
                    주요 특징
                </p>
                <p
                    style={{
                        fontSize: "14px",
                        color: "var(--color-text-secondary)",
                        margin: "8px 0 0",
                        lineHeight: 1.6,
                    }}
                >
                    {species.description}
                </p>
            </div>

            <div
                style={{
                    background: "#f2f0e9",
                    borderRadius: "var(--radius-card)",
                    padding: "14px 18px",
                }}
            >
                <p
                    style={{
                        fontSize: "12.5px",
                        color: "var(--color-text-muted)",
                        margin: 0,
                        lineHeight: 1.5,
                    }}
                >
                    AI 식별 결과는 틀릴 수 있어요. 식용·약용 판단에 사용하지 마세요.
                </p>
            </div>
        </div>
    );
}

function formatDate(isoDate: string) {
    const date = new Date(isoDate);
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
}

function PlaceholderPlantIcon() {
    return (
        <svg width="80" height="80" viewBox="0 0 56 56" fill="none">
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