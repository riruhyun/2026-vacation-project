"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { identifyPlant } from "@/lib/api";
import {
  readIdentifyDraft,
  writeIdentifyCandidates,
} from "@/lib/identify-storage";
import type { IdentifyResponseDto } from "@/types/identify";

const STATUS_MESSAGES = [
  { threshold: 0, text: "사진을 준비하고 있어요" },
  { threshold: 25, text: "식물 특징을 추출하는 중" },
  { threshold: 50, text: "비슷한 종의 특징을 비교하는 중" },
  { threshold: 75, text: "후보를 정리하는 중" },
];

type AnalysisStatus = "loading" | "success" | "error";

export function useIdentifyAnalysis() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<AnalysisStatus>("loading");
  const [response, setResponse] = useState<IdentifyResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const statusMessage = useMemo(
    () =>
      [...STATUS_MESSAGES]
        .reverse()
        .find((message) => progress >= message.threshold)?.text ??
      STATUS_MESSAGES[0].text,
    [progress],
  );

  useEffect(() => {
    let active = true;
    let progressValue = 0;
    const interval = window.setInterval(() => {
      progressValue = Math.min(progressValue + Math.floor(Math.random() * 12) + 4, 95);
      if (active) setProgress(progressValue);
      if (progressValue >= 95) window.clearInterval(interval);
    }, 400);

    async function analyze() {
      await Promise.resolve();
      const draft = readIdentifyDraft();
      if (!draft) {
        router.replace("/capture");
        return;
      }

      if (!active) return;
      setProgress(0);
      setStatus("loading");
      setResponse(null);
      setError(null);

      try {
        const image = await fetch(draft.imageUrl).then((response) =>
          response.blob(),
        );
        const result = await identifyPlant(image, draft.organ);
        if (!active) return;

        window.clearInterval(interval);
        setProgress(100);
        setResponse(result);
        setStatus("success");

        window.setTimeout(() => {
          if (!active) return;
          if (result.candidates.length === 0) {
            router.replace("/identify?step=failed");
            return;
          }

          writeIdentifyCandidates(result);
          router.replace("/identify?step=candidates");
        }, 600);
      } catch {
        if (!active) return;
        window.clearInterval(interval);
        setStatus("error");
        setError("식물 후보를 불러오지 못했습니다.");
        router.replace("/identify?step=failed");
      }
    }

    void analyze();

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [attempt, router]);

  return { progress, status, response, error, retry, statusMessage, router };
}
