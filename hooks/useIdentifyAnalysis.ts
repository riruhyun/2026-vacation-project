"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, identifyPlant } from "@/lib/api";
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

const IDENTIFY_TIMEOUT_MS = 20_000;

type AnalysisStatus = "loading" | "success" | "timeout" | "error";

export function useIdentifyAnalysis() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<AnalysisStatus>("loading");
  const [response, setResponse] = useState<IdentifyResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const cancelRef = useRef<(() => void) | null>(null);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const cancel = useCallback(() => {
    cancelRef.current?.();
    router.push("/identify?step=confirm");
  }, [router]);

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
    let timedOut = false;
    let cancelledByUser = false;
    let progressValue = 0;
    const controller = new AbortController();
    const cancelCurrentAttempt = () => {
      cancelledByUser = true;
      active = false;
      controller.abort();
    };
    cancelRef.current = cancelCurrentAttempt;

    const interval = window.setInterval(() => {
      progressValue = Math.min(progressValue + Math.floor(Math.random() * 12) + 4, 95);
      if (active) setProgress(progressValue);
      if (progressValue >= 95) window.clearInterval(interval);
    }, 400);
    const timeout = window.setTimeout(() => {
      if (!active) return;
      timedOut = true;
      controller.abort();
    }, IDENTIFY_TIMEOUT_MS);

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
        const image = await fetch(draft.imageUrl, {
          signal: controller.signal,
        }).then((response) =>
          response.blob(),
        );
        const result = await identifyPlant(
          image,
          draft.organ,
          controller.signal,
        );
        if (!active) return;

        window.clearInterval(interval);
        window.clearTimeout(timeout);
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
      } catch (caught) {
        if (!active) return;
        window.clearInterval(interval);
        window.clearTimeout(timeout);

        if (cancelledByUser) return;

        if (timedOut) {
          setStatus("timeout");
          setError("분석 시간이 길어지고 있어요. 다시 시도해 주세요.");
          return;
        }

        if (caught instanceof ApiError && caught.isNotIdentified) {
          router.replace("/identify?step=failed");
          return;
        }

        setStatus("error");
        setError(
          caught instanceof ApiError
            ? caught.message
            : "식물 후보를 불러오지 못했습니다. 다시 시도해 주세요.",
        );
      }
    }

    void analyze();

    return () => {
      active = false;
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      if (cancelRef.current === cancelCurrentAttempt) {
        cancelRef.current = null;
      }
      controller.abort();
    };
  }, [attempt, router]);

  return {
    progress,
    status,
    response,
    error,
    retry,
    cancel,
    statusMessage,
  };
}
