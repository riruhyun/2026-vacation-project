"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { PlantPreviewCard } from "@/components/ui/PlantPreviewCard";
import { PlantPlaceholder } from "@/components/ui/PlantPlaceholder";
import { saveDraft } from "@/lib/identify-storage";

const TIPS = [
  { title: "밝기", description: "밝고 선명한 사진" },
  { title: "거리", description: "식물이 크게 보이게" },
  { title: "대상", description: "한 개체만 담기" },
];

export function CaptureScreen() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewUrl(dataUrl);
      saveDraft(dataUrl);
      router.push("/identify?step=confirm");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-6">
      <PageHeader
        title="식물 사진 가져오기"
        subtitle="휴대폰 카메라로 촬영하거나 갤러리의 사진을 선택하세요."
      />

      <PlantPreviewCard
        imageUrl={previewUrl ?? undefined}
        label={previewUrl ? "선택한 식물 사진" : undefined}
        variant="dark"
        placeholder={
          <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
            <p className="text-sm font-medium text-white/80">촬영 또는 사진 선택</p>
            <PlantPlaceholder />
            <p className="text-xs text-white/60">
              선택한 사진은 다음 화면에서 다시 확인할 수 있어요.
            </p>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-3 gap-3">
        {TIPS.map((tip) => (
          <div
            key={tip.title}
            className="rounded-2xl border border-border bg-surface px-3 py-4 text-center"
          >
            <p className="text-sm font-bold text-primary">{tip.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{tip.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-2 pt-8">
        <PrimaryButton onClick={() => cameraInputRef.current?.click()}>
          사진 촬영하기
        </PrimaryButton>
        <SecondaryButton onClick={() => galleryInputRef.current?.click()}>
          갤러리에서 선택하기
        </SecondaryButton>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
      />
    </div>
  );
}
