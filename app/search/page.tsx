// TODO: 검색 결과 -> 내부 식물 데이터 조회 API
// TODO: "선택한 식물로 카드 만들기" -> 촬영 흐름과 연결

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "../../components/layout/PageHeader";
import { searchMockPlantSpecies } from "../../data/mock-plants";

export default function SearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const results = useMemo(() => searchMockPlantSpecies(query), [query]);

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="식물 이름 직접 찾기"
                subtitle="AI 후보에 없다면 이름이나 특징으로 검색하세요."
                showBack
            />

            {/* 검색창 */}
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setSelectedId(null);
                    }}
                    placeholder="식물 이름이나 특징을 입력하세요"
                    className="w-full rounded-[20px] border-[1.5px] border-[var(--color-primary)] bg-[var(--color-white)] py-3.5 pl-4 pr-10 text-sm outline-none"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery("");
                            setSelectedId(null);
                        }}
                        aria-label="검색어 지우기"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-sub)]"
                    >
                        <i className="ri-close-line text-base" aria-hidden="true" />
                    </button>
                )}
            </div>

            {/* 검색 결과 */}
            {query && (
                <>
                    <p className="m-0 text-sm font-bold text-[var(--color-text)]">
                        검색 결과 {results.length}개
                    </p>

                    <div className="flex flex-col gap-2.5">
                        {results.length === 0 && (
                            <p className="py-6 text-center text-xs text-[var(--color-sub)]">
                                일치하는 식물을 찾지 못했어요. 다른 이름으로 검색해보세요.
                            </p>
                        )}

                        {results.map((species) => {
                            const isSelected = selectedId === species.slug;
                            return (
                                <button
                                    key={species.slug}
                                    onClick={() => setSelectedId(species.slug)}
                                    style={
                                        isSelected
                                            ? { border: "2px solid var(--color-primary)" }
                                            : { border: "1px solid transparent" }
                                    }
                                    className="flex h-[112px] w-full items-center gap-3.5 rounded-2xl bg-[var(--color-white)] p-3.5 text-left"
                                >
                                    <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#DCECE2]">
                                        <SmallPlantIcon />
                                    </div>

                                    <div className="flex-1">
                                        <p className="m-0 text-base font-bold text-[var(--color-text)]">
                                            {species.koreanName}
                                        </p>
                                        <p className="m-0 mt-0.5 mb-1 text-xs font-normal text-[var(--color-sub)]">
                                            {species.scientificName}
                                        </p>
                                        <p className="m-0 text-xs font-medium text-[var(--color-primary)]">
                                            {species.season}
                                        </p>
                                    </div>

                                    <i
                                        className="ri-arrow-right-s-line text-lg text-[var(--color-sub)]"
                                        aria-hidden="true"
                                    />
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {/* 안내 문구 + 선택 버튼 */}
            <div className="mt-1 rounded-[20px] bg-[#EEF3EA] px-[18px] py-3.5">
                <p className="m-0 text-xs font-normal leading-relaxed text-[var(--color-sub)]">
                    검색으로 선택한 결과는 &quot;직접 선택&quot;으로 기록됩니다.
                </p>
            </div>

            <button
                type="button"
                disabled={!selectedId}
                style={{
                    color: "var(--color-white)",
                    opacity: selectedId ? 1 : 0.4,
                    cursor: selectedId ? "pointer" : "not-allowed",
                }}
                className="flex h-[54px] w-full items-center justify-center rounded-[20px] bg-[var(--color-primary)] text-base font-semibold"
                onClick={() => {
                    if (!selectedId) return;
                    // TODO: 실제로는 카드 생성 흐름(예: /capture/result?slug=...)으로 이동
                    router.push(`/plants/${selectedId}`);
                }}
            >
                선택한 식물로 카드 만들기
            </button>
        </div>
    );
}

function SmallPlantIcon() {
    return (
        <svg width="30" height="30" viewBox="0 0 56 56" fill="none">
            <path
                d="M28 50V26"
                stroke="var(--color-primary)"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <ellipse cx="20" cy="30" rx="8" ry="5" fill="var(--color-primary)" opacity="0.7" />
            <ellipse cx="36" cy="24" rx="8" ry="5" fill="var(--color-primary)" opacity="0.7" />
            <circle cx="28" cy="14" r="9" fill="#f2b5c4" />
            <circle cx="20" cy="18" r="6" fill="#f6cfd8" />
            <circle cx="36" cy="18" r="6" fill="#f6cfd8" />
        </svg>
    );
}