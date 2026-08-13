"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import { clearIdentifySession } from "@/lib/identify-storage";
import type { CreateObservationResponseDto } from "@/types/observation";

interface IdentifyResultScreenProps {
  response: CreateObservationResponseDto;
}

function NewPlantContent({ response }: IdentifyResultScreenProps) {
  return (
    <>
      <p className="text-sm font-semibold text-[var(--color-primary)]">
        새로운 식물 발견
      </p>
      <h2 className="mt-2 text-3xl font-extrabold text-[var(--color-primary-strong)]">
        {response.observation.displayName}
      </h2>
      <p className="mt-2 text-sm italic text-[var(--color-text-muted)]">
        {response.observation.scientificName}
      </p>
      <div className="mt-6 rounded-[var(--radius-control)] bg-[var(--color-info-surface)] px-5 py-4 text-center">
        <strong className="text-xl text-[var(--color-primary)]">
          +{response.reward.xp} XP
        </strong>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          첫 관찰 기록이 준비됐어요.
        </p>
      </div>
    </>
  );
}

function DuplicatePlantContent({ response }: IdentifyResultScreenProps) {
  return (
    <>
      <p className="text-sm font-semibold text-[var(--color-primary)]">
        또 만났네요
      </p>
      <h2 className="mt-2 text-3xl font-extrabold text-[var(--color-primary-strong)]">
        {response.observation.displayName}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        이번 기록은 {response.reward.plantCount}번째 관찰이에요.
      </p>
      <div className="mt-6 rounded-[var(--radius-control)] bg-[var(--color-info-surface)] px-5 py-4 text-center">
        <strong className="text-xl text-[var(--color-primary)]">
          +{response.reward.xp} XP
        </strong>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          같은 식물의 새 관찰 기록이 준비됐어요.
        </p>
      </div>
    </>
  );
}

export function IdentifyResultScreen({ response }: IdentifyResultScreenProps) {
  const router = useRouter();

  function continueToCollection() {
    clearIdentifySession();
    router.push("/collection");
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        variant="identify"
        title={response.result === "new" ? "새로운 식물 발견!" : "관찰 기록 완료!"}
        subtitle="선택한 식물의 기록을 확인해주세요."
      />

      <section className="overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-sm">
        <div className="aspect-square bg-[var(--color-placeholder)]">
          {/* Captured gallery and camera images are runtime data URLs. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={response.observation.imageUrl}
            alt={`${response.observation.displayName} 관찰 사진`}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="p-6 text-center">
          {response.result === "new" ? (
            <NewPlantContent response={response} />
          ) : (
            <DuplicatePlantContent response={response} />
          )}
        </div>
      </section>

      {response.reward.leveledUp ? (
        <p className="mt-4 rounded-[var(--radius-control)] bg-[var(--color-accent)] px-4 py-3 text-center text-sm font-bold text-[var(--color-primary-strong)]">
          레벨 {response.reward.level} 달성!
        </p>
      ) : null}

      <div className="mt-auto pt-8">
        <Button type="button" fullWidth onClick={continueToCollection}>
          도감으로 계속하기
        </Button>
      </div>
    </div>
  );
}
