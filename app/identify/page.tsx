"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConfirmScreen } from "@/components/identify/ConfirmScreen";
import { AnalyzingScreen } from "@/components/identify/AnalyzingScreen";
import { CandidatesScreen } from "@/components/identify/CandidatesScreen";
import { FailedScreen } from "@/components/identify/FailedScreen";
import { getDraft } from "@/lib/identify-storage";

type IdentifyStep = "confirm" | "analyzing" | "candidates" | "failed";

function IdentifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = (searchParams.get("step") ?? "confirm") as IdentifyStep;
  const [draft] = useState(() => getDraft());

  useEffect(() => {
    if (!draft && step !== "candidates" && step !== "failed") {
      router.replace("/capture");
    }
  }, [draft, step, router]);

  if (!draft && step !== "candidates" && step !== "failed") {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <IdentifyContent />
    </Suspense>
  );
}
