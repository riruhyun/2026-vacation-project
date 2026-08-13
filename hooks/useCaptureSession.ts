"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { captureImageError } from "@/lib/data-url";
import {
  clearIdentifySession,
  writeIdentifyDraft,
} from "@/lib/identify-storage";

export function useCaptureSession() {
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clearIdentifySession();
  }, []);

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
    const validationError = captureImageError(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      clearIdentifySession();
      if (!writeIdentifyDraft(dataUrl, "auto")) {
        setError("사진을 임시 저장하지 못했어요. 더 작은 사진을 선택해 주세요.");
        return;
      }
      setPreviewUrl(dataUrl);
    };
    reader.onerror = () => setError("사진을 읽지 못했어요. 다른 사진을 선택해 주세요.");
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

    clearIdentifySession();
    if (!writeIdentifyDraft(dataUrl, "auto")) {
      setError("사진을 임시 저장하지 못했어요. 갤러리에서 더 작은 사진을 선택해 주세요.");
      return;
    }
    setError(null);
    setPreviewUrl(dataUrl);
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
    error,
    handleFileSelect,
    handleCapture,
    openGallery,
  };
}
