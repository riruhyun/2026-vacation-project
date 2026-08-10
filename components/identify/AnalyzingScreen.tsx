"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlantPreviewCard } from "@/components/ui/PlantPreviewCard";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { StepIndicator } from "@/components/ui/StepIndicator";
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

        clearInterval(interval);
        setProgress(100);

        setTimeout(() => {
          if (candidates.length > 0) {
            saveIdentifyResults(candidates);
            router.replace("/identify?step=candidates");
          } else {
            router.replace("/identify?step=failed");
          }
        }, 600);
      } catch {
        clearInterval(interval);
        router.replace("/identify?step=failed");
      }
    };

    identify();

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-6">
      <PageHeader
        title="식물을 찾고 있어요"
        subtitle="꽃·잎·전체 형태를 비교하고 있습니다."
      />

      <PlantPreviewCard imageUrl={imageUrl} />

      <div className="mt-8 flex flex-col items-center gap-4">
        <CircularProgress progress={progress} />
        <div className="text-center">
          <p className="text-base font-semibold text-foreground">{statusMessage}</p>
          <p className="mt-1 text-sm text-muted">보통 5~10초 정도 걸려요</p>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <StepIndicator
          steps={[
            { label: "사진 확인", status: "done" },
            { label: "후보 검색", status: "active" },
            { label: "정보 연결", status: "pending" },
          ]}
        />
      </div>
    </div>
  );
}
