"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { CandidateCard } from "@/components/ui/CandidateCard";
import { InfoBox } from "@/components/ui/InfoBox";
import { MOCK_CANDIDATES } from "@/data/mock-plants";
import type { PlantCandidate } from "@/types/plant";

function getInitialCandidates() {
  if (typeof window === "undefined") return MOCK_CANDIDATES;

  const stored = sessionStorage.getItem("plant-identify-results");
  if (!stored) return MOCK_CANDIDATES;

  try {
    const parsed = JSON.parse(stored) as PlantCandidate[];
    return parsed.length > 0 ? parsed : MOCK_CANDIDATES;
  } catch {
    return MOCK_CANDIDATES;
  }
}

export function CandidatesScreen() {
  const router = useRouter();
  const [candidates] = useState<PlantCandidate[]>(getInitialCandidates);
  const [selectedId, setSelectedId] = useState(() => candidates[0].id);
  const [confirmedName, setConfirmedName] = useState<string | null>(null);

  const selected = candidates.find((c) => c.id === selectedId) ?? candidates[0];

  const handleConfirm = () => {
    sessionStorage.setItem("plant-selected-candidate", JSON.stringify(selected));
    setConfirmedName(selected.name);
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-6">
      <PageHeader
        title="이 식물이 맞나요?"
        subtitle="AI 후보를 보고 직접 가장 가까운 식물을 선택해주세요."
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
        {confirmedName && (
          <p className="rounded-2xl bg-mint px-4 py-3 text-center text-sm font-semibold text-primary">
            {confirmedName} 후보를 선택했어요
          </p>
        )}
        <PrimaryButton onClick={handleConfirm}>
          {selected.name} 후보 선택
        </PrimaryButton>
        <SecondaryButton onClick={() => router.push("/capture")}>
          사진 다시 가져오기
        </SecondaryButton>
      </div>
    </div>
  );
}
