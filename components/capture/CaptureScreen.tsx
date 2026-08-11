"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IdentifyFlowHeader } from "@/components/identify/IdentifyFlowHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
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
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex min-h-full flex-col">
      <IdentifyFlowHeader
        title="식물 사진 가져오기"
        subtitle="휴대폰 카메라로 촬영하거나 갤러리의 사진을 선택하세요."
      />

      <section className="rounded-[24px] bg-[var(--color-deep-green)] px-8 py-6 text-center text-white">
        <p className="text-[16px] font-bold">촬영 또는 사진 선택</p>
        <div className="mt-8 overflow-hidden rounded-[28px] border-2 border-[var(--color-accent)]/80 bg-[#315542]">
          <div className="flex aspect-square items-center justify-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="선택한 식물 사진"
                className="h-full w-full object-cover"
              />
            ) : (
              <PlantPlaceholder />
            )}
          </div>
        </div>
        <p className="mt-8 text-[14px] leading-relaxed text-white/75">
          선택한 사진은 다음 화면에서 다시 확인할 수 있어요.
        </p>
      </section>

      <div className="mt-7 grid grid-cols-3 gap-3">
        {TIPS.map((tip) => (
          <div
            key={tip.title}
            className="rounded-[16px] bg-white px-3 py-5 text-center"
          >
            <p className="text-sm font-extrabold text-[var(--color-deep-green)]">
              {tip.title}
            </p>
            <p className="mt-4 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
              {tip.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-3 pt-8">
        <PrimaryButton
          onClick={() => {
            if (previewUrl) {
              router.push("/identify?step=confirm");
              return;
            }
            cameraInputRef.current?.click();
          }}
        >
          {previewUrl ? "사진 확인하기" : "사진 촬영하기"}
        </PrimaryButton>
        <div className="flex justify-center">
          <SecondaryButton
            onClick={() => galleryInputRef.current?.click()}
            style={{
              width: "236px",
              padding: "10px 30px",
              borderRadius: "var(--radius-pill)",
              background: "#ffffff",
              fontWeight: 600,
            }}
          >
            {previewUrl ? "갤러리에서 다시 선택하기" : "갤러리에서 선택하기"}
          </SecondaryButton>
        </div>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFileSelect(e.target.files?.[0]);
          e.currentTarget.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFileSelect(e.target.files?.[0]);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
