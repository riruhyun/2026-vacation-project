"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { InfoBox } from "@/components/ui/InfoBox";

export function FailedScreen() {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-6">
      <PageHeader
        title="식별에 실패했어요"
        subtitle="사진 상태를 확인하고 다시 시도하거나 직접 검색해보세요."
        showBack
        onBack={() => router.push("/capture")}
      />

      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-mint">
          <i className="ri-error-warning-line text-5xl leading-none text-primary" aria-hidden="true" />
        </div>
        <p className="mt-6 text-center text-base font-semibold text-foreground">
          식물을 찾지 못했습니다
        </p>
        <p className="mt-2 text-center text-sm text-muted">
          밝은 곳에서 식물 한 개체가 크게 보이도록 다시 촬영해주세요.
        </p>
      </div>

      <div className="mb-4">
        <InfoBox>
          AI가 불확실하면 꽃이나 잎 사진을 추가로 요청할 수 있어요.
        </InfoBox>
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
