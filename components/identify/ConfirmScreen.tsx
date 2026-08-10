"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { PlantPreviewCard } from "@/components/ui/PlantPreviewCard";
import { SelectionChips } from "@/components/ui/SelectionChips";
import { InfoBox } from "@/components/ui/InfoBox";
import { updateDraftPart } from "@/lib/identify-storage";
import type { PlantPart } from "@/types/domain";

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
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-6">
      <PageHeader
        title="사진 확인"
        subtitle="분석 전에 식물이 선명하게 보이는지 확인해주세요."
        onBack={() => router.push("/capture")}
      />

      <PlantPreviewCard imageUrl={imageUrl} />

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-foreground">촬영 부위</p>
        <SelectionChips value={part} onChange={handlePartChange} />
      </div>

      <div className="mt-4">
        <InfoBox>
          AI가 불확실하면 꽃이나 잎 사진을 추가로 요청할 수 있어요.
        </InfoBox>
      </div>

      <div className="mt-auto space-y-2 pt-8">
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
