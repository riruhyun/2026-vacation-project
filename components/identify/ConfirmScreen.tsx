"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IdentifyFlowHeader } from "@/components/identify/IdentifyFlowHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { updateDraftPart } from "@/lib/identify-storage";
import type { PlantPart } from "@/types/domain";

const PARTS: { value: PlantPart; label: string }[] = [
  { value: "auto", label: "자동" },
  { value: "flower", label: "꽃" },
  { value: "leaf", label: "잎" },
  { value: "fruit", label: "열매" },
];

interface ConfirmScreenProps {
  imageUrl: string;
  initialPart: PlantPart;
}

export function ConfirmScreen({ imageUrl, initialPart }: ConfirmScreenProps) {
  const router = useRouter();
  const [part, setPart] = useState<PlantPart>(initialPart);

  const handlePartChange = (newPart: PlantPart) => {
    setPart(newPart);
    updateDraftPart(newPart);
  };

  return (
    <div className="flex min-h-full flex-col">
      <IdentifyFlowHeader
        title="사진 확인"
        subtitle="분석 전에 식물이 선명하게 보이는지 확인해주세요."
        onBack={() => router.push("/capture")}
      />

      <section className="overflow-hidden rounded-[28px]">
        <div className="flex aspect-square items-center justify-center bg-[var(--color-mint-100)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="촬영한 식물 사진"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="bg-[#315f4a] px-4 py-4 text-[13px] font-bold text-white">
          촬영한 식물 사진
        </div>
      </section>

      <div className="mt-8">
        <p className="mb-4 text-[16px] font-extrabold text-[var(--color-text-primary)]">
          촬영 부위
        </p>
        <div className="grid grid-cols-4 gap-3">
          {PARTS.map((item) => {
            const isActive = part === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handlePartChange(item.value)}
                className="rounded-full px-3 py-3 text-[14px] font-bold transition-colors"
                style={{
                  background: isActive ? "var(--color-deep-green)" : "#ffffff",
                  color: isActive ? "#ffffff" : "var(--color-text-secondary)",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-7 rounded-[20px] bg-[#eef5ec] px-5 py-5 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
        AI가 불확실하면 꽃이나 잎 사진을 추가로 요청할 수 있어요.
      </div>

      <div className="mt-auto space-y-3 pt-8">
        <PrimaryButton onClick={() => router.push("/identify?step=analyzing")}>
          이 사진으로 분석
        </PrimaryButton>
        <SecondaryButton onClick={() => router.push("/capture")}>
          다시 촬영
        </SecondaryButton>
      </div>
    </div>
  );
}
