"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConfirmScreen } from "../../components/identify/ConfirmScreen";
import { AnalyzingScreen } from "../../components/identify/AnalyzingScreen";
import { CandidatesScreen } from "../../components/identify/CandidatesScreen";
import { FailedScreen } from "../../components/identify/FailedScreen";
import { getDraft } from "../../lib/identify-storage";
import type { ObservationDraft } from "../../types/observation";

type IdentifyStep = "confirm" | "analyzing" | "candidates" | "failed";

function IdentifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = (searchParams.get("step") ?? "confirm") as IdentifyStep;

  // 서버와 클라이언트의 첫 렌더링 결과를 동일하게 맞추기 위해
  // sessionStorage는 useEffect(클라이언트 전용)에서만 읽는다.
  const [draft, setDraft] = useState<ObservationDraft | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  useEffect(() => {
    setDraft(getDraft());
    setIsDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!isDraftLoaded) return;
    if (!draft && step !== "candidates" && step !== "failed") {
      router.replace("/capture");
    }
  }, [draft, isDraftLoaded, step, router]);

  if (!isDraftLoaded || (!draft && step !== "candidates" && step !== "failed")) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  switch (step) {
    case "confirm":
      return draft ? (
        <ConfirmScreen imageUrl={draft.imageDataUrl} initialPart={draft.part} />
      ) : null;
    case "analyzing":
      return draft ? <AnalyzingScreen imageUrl={draft.imageDataUrl} /> : null;
    case "candidates":
      return <CandidatesScreen />;
    case "failed":
      return <FailedScreen />;
    default:
      router.replace("/capture");
      return null;
  }
}

export default function IdentifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
        </div>
      }
    >
      <IdentifyContent />
    </Suspense>
  );
}