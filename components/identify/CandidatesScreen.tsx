"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
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
      <PageHeader
        title="이 식물이 맞나요?"
        subtitle="AI 후보를 보고 직접 가장 가까운 식물을 선택해주세요."
        showBack
        onBack={() => router.push("/identify?step=confirm")}
      />

      <div className="space-y-4">
        {candidates.map((candidate) => {
          const isSelected = candidate.id === selectedId;
          const description =
            CANDIDATE_DESCRIPTIONS[candidate.name] ?? candidate.description;

          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => setSelectedId(candidate.id)}
              style={{
                background: isSelected ? "#DDEFE3" : "var(--color-white)",
                border: isSelected
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
              }}
              className="h-[142px] w-full rounded-[20px] p-3 text-left transition-colors"
            >
              <div className="flex h-full gap-4">
                <div className="h-[118px] w-[106px] shrink-0 overflow-hidden rounded-2xl bg-[#DCECE2]">
                  {candidate.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={candidate.imageUrl}
                      alt={candidate.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-[var(--color-sub)]">
                      이미지 없음
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="m-0 truncate text-lg font-bold text-[var(--color-text)]">
                      {candidate.name}
                    </h2>
                    <span
                      style={
                        isSelected
                          ? { background: "var(--color-primary)", color: "var(--color-white)" }
                          : { background: "#EEF3EA", color: "var(--color-primary)" }
                      }
                      className="flex h-[30px] w-[62px] shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    >
                      {candidate.confidence}%
                    </span>
                  </div>
                  <p className="m-0 line-clamp-2 text-xs font-normal leading-relaxed text-[var(--color-sub)]">
                    {description}
                  </p>
                  <p className="m-0 text-xs font-semibold text-[var(--color-primary)]">
                    {isSelected ? "선택됨" : "비교하기 ›"}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 rounded-[14px] bg-[#EEF3EA] px-[18px] py-3.5">
        <p className="m-0 text-xs font-medium leading-relaxed text-[var(--color-sub)]">
          AI 결과는 확정이 아니며, 사용자가 고른 결과로 카드가 생성됩니다.
        </p>
      </div>

      <div className="mt-auto space-y-3 pt-6">
        <button
          type="button"
          onClick={() =>
            router.push(
              selected.candidate.plantId === null
                ? "/search"
                : `/plants/${selected.candidate.plantId}`,
            )
          }
          style={{ color: "var(--color-white)" }}
          className="flex h-[54px] w-full items-center justify-center rounded-[20px] bg-[var(--color-primary)] text-base font-semibold"
        >
          {selected.name}으로 카드 만들기
        </button>
        <button
          type="button"
          onClick={() => router.push("/collection")}
          className="w-full py-3 text-center text-xs font-semibold text-[var(--color-primary)]"
        >
          후보에 없어요 · 직접 검색
        </button>
      </div>
    </div>
  );
}