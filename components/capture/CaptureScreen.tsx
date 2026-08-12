"use client";

import { IdentifyFlowHeader } from "../identify/IdentifyFlowHeader";
import { SecondaryButton } from "../ui/SecondaryButton";
import { PlantPlaceholder } from "../ui/PlantPlaceholder";
import { useCaptureSession } from "@/hooks/useCaptureSession";

const TIPS = [
  { title: "밝기", description: "밝고 선명한 사진" },
  { title: "거리", description: "식물이 크게 보이게" },
  { title: "대상", description: "한 개체만 담기" },
];

export function CaptureScreen() {
  const {
    galleryInputRef,
    videoRef,
    previewUrl,
    cameraReady,
    isMirrored,
    handleFileSelect,
    handleCapture,
    openGallery,
  } = useCaptureSession();

  return (
    <div className="flex min-h-full flex-col">
      <IdentifyFlowHeader
        title="식물 사진 가져오기"
        subtitle="휴대폰 카메라로 촬영하거나 갤러리의 사진을 선택하세요."
      />

      <section className="rounded-3xl bg-[#24392F] px-8 py-6 text-center">
        <p style={{ color: "var(--color-white)" }} className="text-base font-bold">
          촬영 또는 사진 선택
        </p>
        <div className="mt-8 h-[300px] overflow-hidden rounded-3xl border-2 border-[var(--color-lime)]/80 bg-[#315542]">
          <div className="flex h-full w-full items-center justify-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="선택한 식물 사진"
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={isMirrored ? { transform: "scaleX(-1)" } : undefined}
                  className={
                    cameraReady
                      ? "h-full w-full object-cover"
                      : "hidden"
                  }
                />
                {!cameraReady && <PlantPlaceholder />}
              </>
            )}
          </div>
        </div>
        <p className="mt-8 text-xs font-normal leading-relaxed text-[#DDEFE3]">
          선택한 사진은 다음 화면에서 다시 확인할 수 있어요.
        </p>
      </section>

      <div className="mt-7 grid grid-cols-3 gap-3">
        {TIPS.map((tip) => (
          <div
            key={tip.title}
            className="rounded-2xl bg-[var(--color-white)] px-3 py-5 text-center"
          >
            <p className="text-sm font-bold text-[var(--color-primary)]">
              {tip.title}
            </p>
            <p className="mt-4 text-xs font-normal leading-relaxed text-[var(--color-sub)]">
              {tip.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-3 pt-8">
        <button
          type="button"
          onClick={handleCapture}
          style={{ color: "var(--color-white)" }}
          className="flex h-[54px] w-full items-center justify-center rounded-[20px] bg-[var(--color-primary)] text-base font-semibold"
        >
          {previewUrl ? "사진 확인하기" : "사진 촬영하기"}
        </button>
        <div className="flex justify-center">
          <SecondaryButton
            onClick={openGallery}
            style={{
              width: "236px",
              padding: "10px 30px",
              borderRadius: "var(--radius-pill)",
              background: "var(--color-white)",
              color: "var(--color-primary)",
              fontWeight: 600,
              fontSize: "12px",
            }}
          >
            {previewUrl ? "갤러리에서 다시 선택하기" : "갤러리에서 선택하기"}
          </SecondaryButton>
        </div>
      </div>

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