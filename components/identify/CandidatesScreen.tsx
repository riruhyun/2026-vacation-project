"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IdentifyFlowHeader } from "@/components/identify/IdentifyFlowHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { MOCK_CANDIDATES } from "@/data/mock-plants";
import { getIdentifyResults } from "@/lib/identify-storage";
import { toCandidateCardViewModel } from "@/lib/identify-candidate";
import type { CandidateCardViewModel } from "@/types/identify";

function getInitialCandidates() {
  return (
    getIdentifyResults() ?? MOCK_CANDIDATES.map(toCandidateCardViewModel)
  );
}

const CANDIDATE_DESCRIPTIONS: Record<string, string> = {
  산철쭉: "꽃잎 5장 · 잎 가장자리에 잔털",
  영산홍: "꽃 안쪽 반점 · 잎이 더 작음",
  진달래: "잎보다 꽃이 먼저 피는 편",
};

export function CandidatesScreen() {
  const router = useRouter();
  const [candidates] = useState<CandidateCardViewModel[]>(getInitialCandidates);
  const [selectedId, setSelectedId] = useState(() => candidates[0].id);

  const selected = candidates.find((c) => c.id === selectedId) ?? candidates[0];

  return (
    <div className="flex min-h-full flex-col">
      <IdentifyFlowHeader
        title="이 식물이 맞나요?"
        subtitle="AI 후보를 보고 직접 가장 가까운 식물을 선택해주세요."
        onBack={() => router.push("/identify?step=confirm")}
      />

      <div className="space-y-5">
        {candidates.map((candidate) => {
          const isSelected = candidate.id === selectedId;
          const description =
            CANDIDATE_DESCRIPTIONS[candidate.name] ?? candidate.description;

          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => setSelectedId(candidate.id)}
              className="w-full rounded-[24px] p-3 text-left transition-colors"
              style={{
                background: isSelected ? "#dff0e4" : "var(--color-surface)",
                border: isSelected ? "2px solid #2e765a" : "2px solid transparent",
              }}
            >
            <div className="flex gap-4">
              <div className="flex h-[118px] w-[112px] shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-[var(--color-mint-100)]">
                {candidate.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={candidate.imageUrl}
                    alt={candidate.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="px-3 text-center text-xs text-[var(--color-text-secondary)]">
                    이미지 없음
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 py-3">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="truncate text-lg font-extrabold text-[var(--color-text-primary)]">
                    {candidate.name}
                  </h2>
                  <span
                    className="rounded-full px-4 py-2 text-sm font-extrabold"
                    style={{
                      background:
                        isSelected
                          ? "var(--color-deep-green)"
                          : "#eef5ec",
                      color:
                        isSelected
                          ? "#ffffff"
                          : "var(--color-deep-green)",
                    }}
                  >
                    {candidate.confidence}%
                  </span>
                </div>
                <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                  {description}
                </p>
                <p className="mt-6 text-[13px] font-extrabold text-[var(--color-deep-green)]">
                  {isSelected ? "선택됨" : "비교하기 ›"}
                </p>
              </div>
            </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 rounded-[20px] bg-[#eef5ec] px-5 py-5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
        AI 결과는 확정이 아니며, 사용자가 고른 결과로 카드가 생성됩니다.
      </div>

      <div className="mt-auto space-y-3 pt-6">
        <PrimaryButton
          onClick={() =>
            router.push(
              selected.candidate.plantId === null
                ? "/search"
                : `/plants/${selected.candidate.plantId}`,
            )
          }
        >
          {selected.name}으로 카드 만들기
        </PrimaryButton>
        <SecondaryButton onClick={() => router.push("/collection")}>
          후보에 없어요 · 직접 검색
        </SecondaryButton>
      </div>
    </div>
  );
}
