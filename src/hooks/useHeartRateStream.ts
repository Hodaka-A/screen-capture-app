"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HeartRateEvent } from "@/types/type";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_ORIGIN!;

export function useHeartRateStream() {
  const ioRef = useRef<any>(null);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<HeartRateEvent[]>([]);
  const [latest, setLatest] = useState<number | null>(null);

  // Socket 接続
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { io } = await import("socket.io-client");
      const socket = io(BACKEND, { transports: ["websocket"] });
      ioRef.current = socket;

      socket.on("connect", () => mounted && setConnected(true));
      socket.on("disconnect", () => mounted && setConnected(false));

      // バックエンドからのデバイス一覧更新（今回はログだけ）
      socket.on("updateDevices", (payload: { devNames: string[] }) => {
        // console.log("devices:", payload.devNames);
      });

      socket.on("addData", (payload: { devName: string; heartRate: number }) => {
        const ev = {
          devName: payload.devName,
          heartRate: payload.heartRate,
          ts: performance.now(),
        };
        setEvents((prev) => {
          const next = [...prev, ev];
          setLatest(ev.heartRate);
          return next;
        });
      });
    })();

    return () => {
      mounted = false;
      ioRef.current?.disconnect?.();
      ioRef.current = null;
    };
  }, []);

  // デバイス探索（REST）
  const refreshDevices = useCallback(async (): Promise<string[]> => {
    const res = await fetch(`${BACKEND}/api/devices`);
    if (!res.ok) throw new Error("failed to fetch devices");
    // レスポンスは { message: "OK" } だが、一覧は Socket で流れてくる仕様
    // なのでバックエンド側の print を頼りにする or ここで返す値は空配列
    return [];
  }, []);

  // デバイス購読開始（REST）
  const subscribe = useCallback(async (devName: string) => {
    const res = await fetch(`${BACKEND}/api/subscribe/${encodeURIComponent(devName)}`);
    if (!res.ok) throw new Error("failed to subscribe");
  }, []);

  // HR バッファを外部へフラッシュ（録画停止時など）
  const drain = useCallback(() => {
    const out = events.slice();
    setEvents([]);
    return out;
  }, [events]);

  return {
    connected,
    latest,      // 最新 HR
    events,      // バッファ（録画中は溜める）
    drain,       // 取り出し＆クリア
    refreshDevices,
    subscribe,
  };
}
