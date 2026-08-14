"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { resolveObservationResult } from "@/lib/identify-observation";
import { writeIdentifyResult } from "@/lib/identify-storage";
import type { IdentifyCandidateDto } from "@/types/identify";
import type { CreateObservationResponseDto } from "@/types/observation";

interface CandidatesScreenProps {
  candidates: IdentifyCandidateDto[];
  imageUrl: string;
}

function formatConfidence(score: number) {
  return `${Math.round(score * 100)}%`;
}

export function CandidatesScreen({
  candidates,
  imageUrl,
}: CandidatesScreenProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedResult, setSavedResult] =
    useState<CreateObservationResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const savingRef = useRef(false);
  const saveControllerRef = useRef<AbortController | null>(null);
  const selected = candidates[selectedIndex];
  const navigationLocked = isSaving || savedResult !== null;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      saveControllerRef.current?.abort();
    };
  }, []);

  async function continueWithCandidate() {
    if (!selected || savingRef.current) return;

    savingRef.current = true;
    const controller = new AbortController();
    saveControllerRef.current = controller;
    setIsSaving(true);
    setError(null);
    try {
      const result = await resolveObservationResult(
        savedResult,
        selected,
        imageUrl,
        controller.signal,
      );
      if (!mountedRef.current) return;

      if (!savedResult) setSavedResult(result);
      if (!writeIdentifyResult(result)) {
        setError("관찰 결과를 임시 저장하지 못했어요. 저장 공간을 확인하고 다시 시도해 주세요.");
        return;
      }
      router.replace("/identify?step=result");
    } catch (caught) {
      if (!mountedRef.current) return;

      if (caught instanceof ApiError && caught.isUnauthorized) {
        router.push("/login?next=%2Fidentify%3Fstep%3Dcandidates");
        return;
      }

      setError(
        caught instanceof ApiError
          ? caught.message
          : "관찰 기록을 저장하지 못했어요. 다시 시도해 주세요.",
      );
    } finally {
      savingRef.current = false;
      if (saveControllerRef.current === controller) {
        saveControllerRef.current = null;
      }
      if (mountedRef.current) setIsSaving(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        variant="identify"
        title="이 식물이 맞나요?"
        subtitle="AI 후보를 보고 직접 가장 가까운 식물을 선택해주세요."
        showBack={!navigationLocked}
        onBack={() => {
          if (!navigationLocked) router.push("/identify?step=confirm");
        }}
      />

      <div className="space-y-4">
        {candidates.map((candidate, index) => {
          const isSelected = index === selectedIndex;

          return (
            <button
              key={`${candidate.scientificName}-${index}`}
              type="button"
              aria-pressed={isSelected}
              disabled={navigationLocked}
              onClick={() => setSelectedIndex(index)}
              className={`h-[142px] w-full rounded-[var(--radius-card)] border-2 p-3 text-left transition-colors ${
                isSelected
                  ? "border-[var(--color-primary)] bg-[var(--color-info-surface)]"
                  : "border-transparent bg-[var(--color-surface)]"
              }`}
            >
              <div className="flex h-full gap-4">
                <div className="relative h-[118px] w-[106px] shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-[var(--color-placeholder)]">
                  {candidate.imageUrl ? (
                    <>
                      {/* PlantNet images can be external and do not have a fixed host. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={candidate.imageUrl}
                        alt={candidate.koreanName}
                        className="h-full w-full object-cover"
                      />
                      {candidate.imageAttribution ? (
                        <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[9px] leading-tight text-white">
                          {candidate.imageAttribution}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[var(--color-text-muted)]">
                      이미지 없음
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="truncate text-lg font-bold text-[var(--color-text)]">
                      {candidate.koreanName}
                    </h2>
                    <span
                      className={`flex h-[30px] min-w-[62px] items-center justify-center rounded-[var(--radius-pill)] px-2 text-xs font-semibold ${
                        isSelected
                          ? "bg-[var(--color-primary)] text-white"
                          : "bg-[var(--color-info-surface)] text-[var(--color-primary)]"
                      }`}
                    >
                      {formatConfidence(candidate.score)}
                    </span>
                  </div>
                  <p className="truncate text-xs italic text-[var(--color-text-muted)]">
                    {candidate.scientificName}
                  </p>
                  <p className="line-clamp-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
                    {candidate.description ?? "도감 설명을 준비하고 있습니다."}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 rounded-[var(--radius-control)] bg-[var(--color-info-surface)] px-[18px] py-3.5">
        <p className="text-xs font-medium leading-relaxed text-[var(--color-text-muted)]">
          AI 결과는 확정이 아니며, 사용자가 고른 결과로 기록이 만들어집니다.
        </p>
      </div>

      <div className="mt-auto space-y-2 pt-6">
        {error ? (
          <p role="alert" className="text-center text-xs text-red-700">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          fullWidth
          disabled={!selected || isSaving}
          onClick={continueWithCandidate}
        >
          {isSaving
            ? "기록 만드는 중…"
            : savedResult
              ? "결과 화면 다시 열기"
              : `${selected?.koreanName ?? "선택한 식물"}로 기록하기`}
        </Button>
        <Button
          type="button"
          variant="ghost"
          fullWidth
          disabled={navigationLocked}
          onClick={() => router.push("/search?mode=identify")}
        >
          후보에 없어요 · 직접 검색
        </Button>
      </div>
    </div>
  );
}
