"use client";

import { Suspense, useEffect, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalyzingScreen } from "@/components/identify/AnalyzingScreen";
import { CandidatesScreen } from "@/components/identify/CandidatesScreen";
import { ConfirmScreen } from "@/components/identify/ConfirmScreen";
import { FailedScreen } from "@/components/identify/FailedScreen";
import { IdentifyResultScreen } from "@/components/identify/IdentifyResultScreen";
import {
  readIdentifyCandidates,
  readIdentifyDraft,
  readIdentifyResult,
  type IdentifyDraft,
} from "@/lib/identify-storage";
import type { IdentifyResponseDto, IdentifyStep } from "@/types/identify";
import type { CreateObservationResponseDto } from "@/types/observation";

const STEPS: readonly IdentifyStep[] = [
  "confirm",
  "analyzing",
  "candidates",
  "failed",
  "result",
];

function LoadingState() {
  return <div className="min-h-60" aria-label="화면 불러오는 중" />;
}

function subscribe() {
  return () => {};
}

let cachedSignature = "";
let cachedSession: {
  draft: IdentifyDraft | null;
  candidates: IdentifyResponseDto | null;
  result: CreateObservationResponseDto | null;
} | null = null;

function readSession(step: string) {
  const nextSession = {
    draft: readIdentifyDraft(),
    candidates: readIdentifyCandidates(),
    result: readIdentifyResult(),
  };
  const signature = JSON.stringify([step, nextSession]);
  if (cachedSession && cachedSignature === signature) return cachedSession;
  cachedSignature = signature;
  cachedSession = nextSession;
  return cachedSession;
}

function IdentifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedStep = searchParams.get("step") ?? "confirm";
  const step = STEPS.includes(requestedStep as IdentifyStep)
    ? (requestedStep as IdentifyStep)
    : null;
  const session = useSyncExternalStore(
    subscribe,
    () => readSession(requestedStep),
    () => null,
  );

  useEffect(() => {
    if (!session) return;
    const missingRequiredState =
      !step ||
      ((step === "confirm" || step === "analyzing") && !session.draft) ||
      (step === "candidates" && (!session.draft || !session.candidates)) ||
      (step === "failed" && !session.draft) ||
      (step === "result" && (!session.draft || !session.result));
    if (missingRequiredState) router.replace("/capture");
  }, [router, session, step]);

  if (!session || !step) return <LoadingState />;

  if (step === "confirm" && session.draft) {
    return <ConfirmScreen imageUrl={session.draft.imageUrl} initialOrgan={session.draft.organ} />;
  }
  if (step === "analyzing" && session.draft) {
    return <AnalyzingScreen imageUrl={session.draft.imageUrl} />;
  }
  if (step === "candidates" && session.draft && session.candidates) {
    return <CandidatesScreen candidates={session.candidates.candidates} />;
  }
  if (step === "failed") return <FailedScreen />;
  if (step === "result" && session.result) {
    return <IdentifyResultScreen response={session.result} />;
  }
  return <LoadingState />;
}

export default function IdentifyPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <IdentifyContent />
    </Suspense>
  );
}
