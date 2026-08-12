"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export function useIdentifyAnalysis() {
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

  return { progress, statusMessage, router };
}
