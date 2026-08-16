"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import { clearIdentifySession } from "@/lib/identify-storage";
import type { CreateObservationResponseDto } from "@/types/observation";

interface IdentifyResultScreenProps {
  response: CreateObservationResponseDto;
}

function XpBreakdown({ response }: IdentifyResultScreenProps) {
  const { breakdown, xp } = response.reward;
  // 흔함 희귀도처럼 0 XP인 사유는 굳이 보여주지 않습니다.
  const visibleEvents = breakdown.filter((event) => event.xp > 0);

  if (xp === 0) {
    return (
      <div className="mt-6 rounded-[var(--radius-control)] bg-[var(--color-info-surface)] px-5 py-4 text-center">
        <strong className="text-xl text-[var(--color-primary)]">+0 XP</strong>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          오늘 이미 기록한 식물이라 경험치는 내일 다시 쌓여요.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-[var(--radius-control)] bg-[var(--color-info-surface)] px-5 py-4">
      <ul className="flex flex-col gap-1 text-sm text-[var(--color-text-muted)]">
        {visibleEvents.map((event) => (
          <li key={event.type} className="flex justify-between">
            <span>{event.label}</span>
            <span>+{event.xp} XP</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-center">
        <strong className="text-xl text-[var(--color-primary)]">+{xp} XP</strong>
      </p>
    </div>
  );
}

function LevelProgress({ response }: IdentifyResultScreenProps) {
  const { level, currentLevelXp, xpToNextLevel } = response.reward;
  const percent = xpToNextLevel
    ? Math.min(Math.round((currentLevelXp / xpToNextLevel) * 100), 100)
    : 0;

  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between text-sm">
        <strong className="text-[var(--color-primary-strong)]">Lv.{level}</strong>
        <span className="text-[var(--color-text-muted)]">
          {currentLevelXp} / {xpToNextLevel} XP
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-placeholder)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
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
      <XpBreakdown response={response} />
      <LevelProgress response={response} />
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
      <XpBreakdown response={response} />
      <LevelProgress response={response} />
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
