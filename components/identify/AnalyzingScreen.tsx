"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { identifyPlant } from "@/lib/api";
import { dataUrlToFile } from "@/lib/data-url";
import { getDraft, saveIdentifyResults } from "@/lib/identify-storage";
import { toCandidateCardViewModel } from "@/lib/identify-candidate";

const STATUS_MESSAGES = [
  { threshold: 0, text: "사진을 준비하는 중" },
  { threshold: 25, text: "식물 특징을 추출하는 중" },
  { threshold: 50, text: "비슷한 종의 특징을 비교하는 중" },
  { threshold: 75, text: "후보를 정리하는 중" },
];

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
          stroke="#DDEFE3"
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
      <span className="absolute text-2xl font-bold text-[var(--color-deep)]">
        {progress}%
      </span>
    </div>
  );
}

export function AnalyzingScreen({ imageUrl }: AnalyzingScreenProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  const statusMessage =
    [...STATUS_MESSAGES].reverse().find((msg) => progress >= msg.threshold)?.text ??
    STATUS_MESSAGES[0].text;

  useEffect(() => {
    const draft = getDraft();
    if (!draft) {
      router.replace("/capture");
      return;
    }

    let current = 0;
    let isActive = true;
    const interval = setInterval(() => {
      current = Math.min(current + Math.floor(Math.random() * 12) + 4, 95);
      setProgress(current);
      if (current >= 95) clearInterval(interval);
    }, 400);

    const identify = async () => {
      try {
        const image = await dataUrlToFile(draft.imageDataUrl, "plant");
        const data = await identifyPlant(image);
        const candidates = data.candidates.map(toCandidateCardViewModel);

        if (!isActive) return;
        clearInterval(interval);
        setProgress(100);

        setTimeout(() => {
          if (!isActive) return;
          if (candidates.length > 0) {
            saveIdentifyResults(candidates);
            router.replace("/identify?step=candidates");
          } else {
            router.replace("/identify?step=failed");
          }
        }, 600);
      } catch {
        if (!isActive) return;
        clearInterval(interval);
        router.replace("/identify?step=failed");
      }
    };

    identify();

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [router]);

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="식물을 찾고 있어요"
        subtitle="꽃·잎·전체 형태를 비교하고 있습니다."
        showBack
        onBack={() => router.push("/identify?step=confirm")}
      />

      <section className="mx-auto h-[330px] w-[282px] overflow-hidden rounded-[20px]">
        <div className="flex h-[282px] w-full items-center justify-center bg-[#DCECE2]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="분석 중인 식물 사진"
            className="h-full w-full object-cover"
          />
        </div>
        <div
          style={{ color: "var(--color-white)" }}
          className="flex h-12 items-center bg-[var(--color-deep)] px-4 text-xs font-semibold"
        >
          촬영한 식물 사진
        </div>
      </section>

      <div className="mt-10 flex flex-col items-center gap-7">
        <ProgressRing progress={progress} />
        <div className="text-center">
          <p className="text-base font-semibold text-[var(--color-text)]">
            {statusMessage}
          </p>
          <p className="mt-3 text-xs font-normal text-[var(--color-sub)]">
            보통 5~10초 정도 걸려요
          </p>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <div
          style={{ color: "var(--color-primary)" }}
          className="mx-auto flex h-10 w-[262px] items-center justify-center rounded-full bg-[var(--color-white)] text-center text-xs font-medium"
        >
          사진 확인&nbsp;&nbsp;✓&nbsp;&nbsp; 후보 검색&nbsp;&nbsp;·&nbsp;&nbsp; 정보 연결
        </div>
      </div>
    </div>
  );
}