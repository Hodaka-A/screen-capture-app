"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";           // ★ 型だけ先に読み込み
import { io } from "socket.io-client";                    // ★ v3/v4の正しいimport
import type { HeartRateEvent } from "@/types/type";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_ORIGIN!;

export function useHeartRateStream() {
  const socketRef = useRef<Socket | null>(null);          // ★ anyを撤去して型付け
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<HeartRateEvent[]>([]);
  const [latest, setLatest] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    // 接続
    const socket = io(BACKEND, {
      transports: ["websocket"],
      // 必要に応じて
      // path: "/socket.io",
      // withCredentials: true,
      // reconnection: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => mounted && setConnected(true));
    socket.on("disconnect", () => mounted && setConnected(false));

    socket.on("updateDevices", (payload: { devNames: string[] }) => {
      // 必要に応じて処理
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

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const refreshDevices = useCallback(async (): Promise<string[]> => {
    const res = await fetch(`${BACKEND}/api/devices`);
    if (!res.ok) throw new Error("failed to fetch devices");
    return []; // 一覧はSocketで通知される前提
  }, []);

  const subscribe = useCallback(async (devName: string) => {
    const res = await fetch(
      `${BACKEND}/api/subscribe/${encodeURIComponent(devName)}`
    );
    if (!res.ok) throw new Error("failed to subscribe");
  }, []);

  const drain = useCallback(() => {
    const out = events.slice();
    setEvents([]);
    return out;
  }, [events]);

  return {
    connected,
    latest,
    events,
    drain,
    refreshDevices,
    subscribe,
  };
}
