// TODO: 검색 결과 -> 내부 식물 데이터 조회 API
// TODO: "선택한 식물로 카드 만들기" -> 촬영 흐름과 연결

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import { searchMockPlantSpecies } from "@/data/mock-plants";

export default function SearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const results = useMemo(() => searchMockPlantSpecies(query), [query]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <PageHeader title="식물 이름 직접 찾기" showBack />

            <p
                style={{
                    fontSize: "13px",
                    color: "var(--color-text-secondary)",
                    margin: "-8px 0 0",
                }}
            >
                AI 후보에 없다면 이름이나 특징으로 검색하세요.
            </p>

            {/* 검색창 */}
            <div style={{ position: "relative" }}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setSelectedId(null);
                    }}
                    placeholder="식물 이름이나 특징을 입력하세요"
                    style={{
                        width: "100%",
                        padding: "14px 40px 14px 16px",
                        borderRadius: "var(--radius-button)",
                        border: "1.5px solid var(--color-deep-green)",
                        fontSize: "15px",
                        outline: "none",
                    }}
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery("");
                            setSelectedId(null);
                        }}
                        aria-label="검색어 지우기"
                        style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--color-text-muted)",
                            fontSize: "16px",
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* 검색 결과 */}
            {query && (
                <>
                    <p style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>
                        검색 결과 {results.length}개
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {results.length === 0 && (
                            <p
                                style={{
                                    fontSize: "13px",
                                    color: "var(--color-text-muted)",
                                    padding: "24px 0",
                                    textAlign: "center",
                                }}
                            >
                                일치하는 식물을 찾지 못했어요. 다른 이름으로 검색해보세요.
                            </p>
                        )}

                        {results.map((species) => {
                            const isSelected = selectedId === species.slug;
                            return (
                                <button
                                    key={species.slug}
                                    onClick={() => setSelectedId(species.slug)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "14px",
                                        padding: "14px",
                                        background: "var(--color-surface)",
                                        border: isSelected
                                            ? "2px solid var(--color-deep-green)"
                                            : "1px solid var(--color-border)",
                                        borderRadius: "var(--radius-card)",
                                        cursor: "pointer",
                                        textAlign: "left",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "56px",
                                            height: "56px",
                                            flexShrink: 0,
                                            borderRadius: "14px",
                                            background: "var(--color-mint-100)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <SmallPlantIcon />
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>
                                            {species.koreanName}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "12.5px",
                                                fontStyle: "italic",
                                                color: "var(--color-text-secondary)",
                                                margin: "2px 0 4px",
                                            }}
                                        >
                                            {species.scientificName}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "12.5px",
                                                color: "var(--color-text-muted)",
                                                margin: 0,
                                            }}
                                        >
                                            {species.season}
                                        </p>
                                    </div>

                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M9 6L15 12L9 18"
                                            stroke="var(--color-text-muted)"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {/* 안내 문구 + 선택 버튼 */}
            <div
                style={{
                    background: "#f2f0e9",
                    borderRadius: "var(--radius-card)",
                    padding: "14px 18px",
                    marginTop: "4px",
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
                    검색으로 선택한 결과는 &quot;직접 선택&quot;으로 기록됩니다.
                </p>
            </div>

            <Button
                variant="primary"
                fullWidth
                disabled={!selectedId}
                style={{ opacity: selectedId ? 1 : 0.4, cursor: selectedId ? "pointer" : "not-allowed" }}
                onClick={() => {
                    if (!selectedId) return;
                    // TODO: 실제로는 카드 생성 흐름(예: /capture/result?slug=...)으로 이동
                    router.push(`/plants/${selectedId}`);
                }}
            >
                선택한 식물로 카드 만들기
            </Button>
        </div>
    );
}

function SmallPlantIcon() {
    return (
        <svg width="30" height="30" viewBox="0 0 56 56" fill="none">
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
