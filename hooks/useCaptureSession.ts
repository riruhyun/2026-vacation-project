"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveDraft } from "@/lib/identify-storage";

export function useCaptureSession() {
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);

  useEffect(() => {
    if (previewUrl) return;

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const settings = stream.getVideoTracks()[0]?.getSettings();
        setIsMirrored(!settings?.facingMode || settings.facingMode === "user");
        setCameraReady(true);
      } catch {
        setCameraReady(false);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback((file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewUrl(dataUrl);
      saveDraft(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleCapture = useCallback(() => {
    if (previewUrl) {
      router.push("/identify?step=confirm");
      return;
    }

    const video = videoRef.current;
    if (!cameraReady || !video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    setPreviewUrl(dataUrl);
    saveDraft(dataUrl);
    router.push("/identify?step=confirm");
  }, [cameraReady, isMirrored, previewUrl, router]);

  const openGallery = useCallback(() => {
    galleryInputRef.current?.click();
  }, []);

  return {
    galleryInputRef,
    videoRef,
    previewUrl,
    cameraReady,
    isMirrored,
    handleFileSelect,
    handleCapture,
    openGallery,
  };
}
