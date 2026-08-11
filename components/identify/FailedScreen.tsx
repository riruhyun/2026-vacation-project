"use client";

import { useRouter } from "next/navigation";
import { IdentifyFlowHeader } from "@/components/identify/IdentifyFlowHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";

export function FailedScreen() {
  const router = useRouter();

  return (
    <div className="flex min-h-full flex-col">
      <IdentifyFlowHeader
        title="식별에 실패했어요"
        subtitle="사진 상태를 확인하고 다시 시도하거나 직접 검색해보세요."
        onBack={() => router.push("/capture")}
      />

      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#eef5ec]">
          <i
            className="ri-error-warning-line text-6xl leading-none text-[var(--color-deep-green)]"
            aria-hidden="true"
          />
        </div>
        <p className="mt-7 text-center text-lg font-extrabold text-[var(--color-text-primary)]">
          식물을 찾지 못했습니다
        </p>
        <p className="mt-3 text-center text-sm leading-relaxed text-[var(--color-text-secondary)]">
          밝은 곳에서 식물 한 개체가 크게 보이도록 다시 촬영해주세요.
        </p>
      </div>

      <div className="mb-4 rounded-[20px] bg-[#eef5ec] px-5 py-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        AI가 불확실하면 꽃이나 잎 사진을 추가로 요청할 수 있어요.
      </div>

      <div className="space-y-2">
        <PrimaryButton onClick={() => router.push("/capture")}>
          다시 촬영하기
        </PrimaryButton>
        <SecondaryButton onClick={() => router.push("/collection")}>
          직접 검색하기
        </SecondaryButton>
      </div>
    </div>
  );
}
