"use client";

import { startCapture } from "@/utils/capture/startCapture";
import { stopCapture } from "@/utils/capture/stopCapture";
import { useRef, useState } from "react";

export const useScreenCapture = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCapture, setIsCapture] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startScreenCapture = async () => {
    try {
      if (!videoRef.current) return;
      const stream = await startCapture(videoRef.current);
      streamRef.current = stream;

      setIsCapture(true);
      setError(null);

      const srcObject = videoRef.current.srcObject;
      if (srcObject instanceof MediaStream) {
        const [videoTrack] = srcObject.getVideoTracks();
        if (videoTrack) {
          videoTrack.addEventListener("ended", stopScreenCapture, {
            once: true,
          });
        }
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "画面キャプチャの開始に失敗しました。";

      console.error("画面キャプチャの開始に失敗しました:", error);

      setError(errorMsg);
    }
  };

  const stopScreenCapture = () => {
    if (!videoRef.current) return;
    stopCapture(videoRef.current);
    setIsCapture(false);
  };

  return {
    videoRef,
     streamRef,
    isCapture,
    error,
    startScreenCapture,
    stopScreenCapture,
  };
};
