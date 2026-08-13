"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import { writeIdentifyDraft } from "@/lib/identify-storage";
import { PLANT_ORGANS, type PlantOrgan } from "@/types/domain";

const ORGAN_LABELS = {
  auto: "자동",
  flower: "꽃",
  leaf: "잎",
  fruit: "열매",
} satisfies Record<PlantOrgan, string>;

const ORGAN_OPTIONS = PLANT_ORGANS.map((value) => ({
  value,
  label: ORGAN_LABELS[value],
}));

interface ConfirmScreenProps {
  imageUrl: string;
  initialOrgan: PlantOrgan;
}

export function ConfirmScreen({ imageUrl, initialOrgan }: ConfirmScreenProps) {
  const router = useRouter();
  const [organ, setOrgan] = useState<PlantOrgan>(initialOrgan);

  const handleOrganChange = (newOrgan: PlantOrgan) => {
    setOrgan(newOrgan);
  };

  const handleConfirm = () => {
    writeIdentifyDraft(imageUrl, organ);
    router.push("/identify?step=analyzing");
  };

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        variant="identify"
        title="사진 확인"
        subtitle="분석 전에 식물이 선명하게 보이는지 확인해주세요."
        showBack
        onBack={() => router.push("/capture")}
      />

      <section className="overflow-hidden rounded-[28px]">
        <div className="flex aspect-square items-center justify-center bg-[var(--color-placeholder)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="촬영한 식물 사진"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="bg-[var(--color-primary-strong)] px-4 py-4 text-[13px] font-bold text-[var(--color-surface)]">
          촬영한 식물 사진
        </div>
      </section>

      <div className="mt-8">
        <p className="mb-4 text-base font-extrabold text-[var(--color-text)]">
          촬영 부위
        </p>
        <div className="grid grid-cols-4 gap-3" role="radiogroup" aria-label="촬영한 식물 부위">
          {ORGAN_OPTIONS.map((item) => {
            const isActive = organ === item.value;
            return (
              <button
                key={item.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => handleOrganChange(item.value)}
                className={`rounded-full px-3 py-3 text-sm font-bold transition-colors ${isActive ? "bg-[var(--color-primary)] text-[var(--color-surface)]" : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-7 rounded-[var(--radius-card)] bg-[var(--color-info-surface)] px-5 py-5 text-sm leading-relaxed text-[var(--color-text-muted)]">
        AI가 불확실하면 꽃이나 잎 사진을 추가로 요청할 수 있어요.
      </div>

      <div className="mt-auto space-y-3 pt-8">
        <Button type="button" fullWidth onClick={handleConfirm}>
          이 사진으로 분석
        </Button>
        <Button type="button" variant="ghost" fullWidth onClick={() => router.push("/capture")}>
          다시 촬영
        </Button>
      </div>
    </div>
  );
}
