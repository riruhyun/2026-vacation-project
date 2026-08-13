"use client";

import PageHeader from "@/components/layout/PageHeader";
import { useIdentifyAnalysis } from "@/hooks/useIdentifyAnalysis";

interface AnalyzingScreenProps {
  imageUrl: string;
}

function ProgressRing({ progress }: { progress: number }) {
  const size = 120;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-placeholder)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <span className="absolute text-2xl font-bold text-[var(--color-primary-strong)]">
        {progress}%
      </span>
    </div>
  );
}

export function AnalyzingScreen({ imageUrl }: AnalyzingScreenProps) {
  const { progress, statusMessage, router } = useIdentifyAnalysis();

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        variant="identify"
        title="식물을 찾고 있어요"
        subtitle="꽃·잎·전체 형태를 비교하고 있습니다."
        showBack
        onBack={() => router.push("/identify?step=confirm")}
      />

      <section className="mx-auto h-[330px] w-[282px] overflow-hidden rounded-[20px]">
        <div className="flex h-[282px] w-full items-center justify-center bg-[var(--color-placeholder)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="분석 중인 식물 사진"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex h-12 items-center bg-[var(--color-primary-strong)] px-4 text-xs font-semibold text-[var(--color-surface)]">
          촬영한 식물 사진
        </div>
      </section>

      <div className="mt-10 flex flex-col items-center gap-7">
        <ProgressRing progress={progress} />
        <div className="text-center">
          <p className="text-base font-semibold text-[var(--color-text)]">
            {statusMessage}
          </p>
          <p className="mt-3 text-xs font-normal text-[var(--color-text-muted)]">
            보통 5~10초 정도 걸려요
          </p>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <div className="mx-auto flex h-10 w-[262px] items-center justify-center rounded-full bg-[var(--color-surface)] text-center text-xs font-medium text-[var(--color-primary)]">
          사진 확인&nbsp;&nbsp;✓&nbsp;&nbsp; 후보 검색&nbsp;&nbsp;·&nbsp;&nbsp; 정보 연결
        </div>
      </div>
    </div>
  );
}
