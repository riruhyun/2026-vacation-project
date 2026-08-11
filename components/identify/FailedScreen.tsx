"use client";

import { useRouter } from "next/navigation";
import { IdentifyFlowHeader } from "@/components/identify/IdentifyFlowHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";

const RETRY_TIPS = [
  { index: 1, title: "꽃", description: "꽃잎과 중심을 가까이" },
  { index: 2, title: "잎", description: "잎맥과 가장자리를 선명하게" },
  { index: 3, title: "전체", description: "줄기와 전체 형태가 보이게" },
];

export function FailedScreen() {
  const router = useRouter();

  return (
    <div className="flex min-h-full flex-col">
      <IdentifyFlowHeader
        title="식별하기 어려워요"
        subtitle="사진에서 충분한 특징을 찾지 못했습니다."
        onBack={() => router.push("/capture")}
      />

      <section className="flex flex-col items-center pt-11 text-center">
        <div className="flex h-[142px] w-[142px] items-center justify-center rounded-full bg-[#eef5ec]">
          <span className="text-[64px] font-extrabold leading-none text-[var(--color-deep-green)]">
            ?
          </span>
        </div>

        <h2 className="mt-9 text-[24px] font-extrabold leading-tight text-[var(--color-deep-green)]">
          다른 특징을 보여주세요
        </h2>
        <p className="mt-5 max-w-[260px] text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          한 장의 사진보다 서로 다른 부위가 보이면 후보를 찾을 가능성이 높아져요.
        </p>
      </section>

      <div className="mt-12 space-y-3">
        {RETRY_TIPS.map((tip) => (
          <div
            key={tip.index}
            className="flex items-center rounded-[18px] bg-white px-4 py-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-[var(--color-mint-100)] text-[13px] font-extrabold text-[var(--color-deep-green)]">
              {tip.index}
            </span>
            <strong className="ml-5 w-10 text-[14px] font-extrabold text-[var(--color-text-primary)]">
              {tip.title}
            </strong>
            <span className="ml-5 text-[13px] text-[var(--color-text-secondary)]">
              {tip.description}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-3 pt-8">
        <PrimaryButton onClick={() => router.push("/capture")}>
          사진 추가해서 다시 분석
        </PrimaryButton>
        <SecondaryButton onClick={() => router.push("/search")}>
          직접 이름 검색하기
        </SecondaryButton>
      </div>
    </div>
  );
}
