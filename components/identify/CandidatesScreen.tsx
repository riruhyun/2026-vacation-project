"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { CandidateCard } from "@/components/ui/CandidateCard";
import { InfoBox } from "@/components/ui/InfoBox";
import { MOCK_CANDIDATES } from "@/data/mock-plants";
import { getIdentifyResults } from "@/lib/identify-storage";
import { toCandidateCardViewModel } from "@/lib/identify-candidate";
import type { CandidateCardViewModel } from "@/types/identify";

function getInitialCandidates() {
  return (
    getIdentifyResults() ?? MOCK_CANDIDATES.map(toCandidateCardViewModel)
  );
}

export function CandidatesScreen() {
  const router = useRouter();
  const [candidates] = useState<CandidateCardViewModel[]>(getInitialCandidates);
  const [selectedId, setSelectedId] = useState(() => candidates[0].id);

  const selected = candidates.find((c) => c.id === selectedId) ?? candidates[0];

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-6">
      <PageHeader
        title="이 식물이 맞나요?"
        subtitle="AI 후보를 보고 직접 가장 가까운 식물을 선택해주세요."
        showBack
        onBack={() => router.push("/identify?step=confirm")}
      />

      <div className="space-y-3">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            selected={candidate.id === selectedId}
            onSelect={() => setSelectedId(candidate.id)}
          />
        ))}
      </div>

      <div className="mt-4">
        <InfoBox>
          AI 결과는 확정이 아니며, 사용자가 고른 결과로 카드가 생성됩니다.
        </InfoBox>
      </div>

      <div className="mt-auto space-y-2 pt-8">
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
