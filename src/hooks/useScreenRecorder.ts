"use client";

import { useCallback, useRef, useState } from "react";
import type { RecordingChunk } from "@/types/type";

export function useScreenRecorder() {
  const mediaRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [chunks, setChunks] = useState<RecordingChunk[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const start = useCallback(async (fps = 30) => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: fps },
      audio: true, // 必要に応じて
    });
    mediaRef.current = stream;

    const rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
    recRef.current = rec;
    setChunks([]);
    const t0 = performance.now();
    setStartedAt(t0);

    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        setChunks((prev) => [...prev, { ts: performance.now(), blob: e.data }]);
      }
    };

    rec.onstop = () => {
      setRecording(false);
      stream.getTracks().forEach((t) => t.stop());
      mediaRef.current = null;
      recRef.current = null;
    };

    rec.start(1000); // 1秒ごとに chunk
    setRecording(true);
  }, []);

  const stop = useCallback(async () => {
    recRef.current?.stop();
  }, []);

  return {
    start,
    stop,
    recording,
    chunks,
    startedAt,
  };
}

