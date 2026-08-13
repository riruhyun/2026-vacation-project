"use client";

import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import { PlantPlaceholder } from "@/components/ui/PlantPlaceholder";
import { useCaptureSession } from "@/hooks/useCaptureSession";
import { IMAGE_INPUT_ACCEPT } from "@/lib/image-constraints";

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
    error,
    handleFileSelect,
    handleCapture,
    openGallery,
  } = useCaptureSession();

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        variant="identify"
        title="식물 사진 가져오기"
        subtitle="카메라로 촬영하거나 갤러리에서 사진을 선택하세요."
      />

      <section className="rounded-3xl bg-[var(--color-primary-strong)] px-8 py-6 text-center text-[var(--color-surface)]">
        <p className="text-base font-bold">촬영 또는 사진 선택</p>
        <div className="mt-8 h-[300px] overflow-hidden rounded-3xl border-2 border-[var(--color-accent)] bg-[var(--color-primary)]">
          <div className="flex h-full w-full items-center justify-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="선택한 식물" className="h-full w-full object-cover" />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`${cameraReady ? "h-full w-full object-cover" : "hidden"} ${isMirrored ? "-scale-x-100" : ""}`}
                />
                {!cameraReady ? <PlantPlaceholder /> : null}
              </>
            )}
          </div>
        </div>
        <p className="mt-8 text-xs leading-relaxed text-[var(--color-info-surface)]">
          선택한 사진은 다음 화면에서 다시 확인할 수 있어요.
        </p>
      </section>

      <div className="mt-7 grid grid-cols-3 gap-3">
        {TIPS.map((tip) => (
          <div key={tip.title} className="rounded-[var(--radius-control)] bg-[var(--color-surface)] px-3 py-5 text-center">
            <p className="text-sm font-bold text-[var(--color-primary)]">{tip.title}</p>
            <p className="mt-4 text-xs leading-relaxed text-[var(--color-text-muted)]">{tip.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-3 pt-8">
        <Button type="button" fullWidth disabled={!previewUrl && !cameraReady} onClick={handleCapture}>
          {previewUrl ? "사진 확인하기" : "사진 촬영하기"}
        </Button>
        {!previewUrl && !cameraReady ? (
          <p className="text-center text-xs text-[var(--color-text-muted)]">
            카메라를 사용할 수 없어요. 아래에서 갤러리 사진을 선택해 주세요.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-center text-xs font-semibold text-red-700">
            {error}
          </p>
        ) : null}
        <div className="flex justify-center">
          <Button type="button" variant="ghost" onClick={openGallery} className="min-h-10 rounded-[var(--radius-pill)] px-8 py-2 text-xs">
            {previewUrl ? "갤러리에서 다시 선택하기" : "갤러리에서 선택하기"}
          </Button>
        </div>
      </div>

      <input
        ref={galleryInputRef}
        type="file"
        accept={IMAGE_INPUT_ACCEPT}
        className="hidden"
        onChange={(event) => {
          handleFileSelect(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
