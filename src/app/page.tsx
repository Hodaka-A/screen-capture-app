"use client";

import { useRef, useState } from "react";
import { useHeartRateStream } from "@/hooks/useHeartRateStream";
import { useScreenRecorder } from "@/hooks/useScreenRecorder";
import { HeartOverlay } from "@/components/HeartOverlay";
import { downloadJson, downloadWebM, syncHeartRates } from "@/lib/sync";

const CANDIDATE_DEVICES = [
  // Flask 側の print を見て名前が分かっている想定（例）
  "Polar Verity Sense",
  // 必要に応じて追記 or デバイス一覧 API を拡張する
];

export default function Page() {
  const {
    connected,
    latest,
    events,
    drain,
    refreshDevices,
    subscribe,
  } = useHeartRateStream();

  const {
    start,
    stop,
    recording,
    chunks,
    startedAt,
  } = useScreenRecorder();

  const [selectedDevice, setSelectedDevice] = useState(CANDIDATE_DEVICES[0]);
  const [log, setLog] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleRefresh = async () => {
    await refreshDevices();
    setLog((l) => ["デバイス探索リクエストを送信しました（一覧はSocketで通知）", ...l]);
  };

  const handleSubscribe = async () => {
    if (!selectedDevice) return;
    await subscribe(selectedDevice);
    setLog((l) => [`${selectedDevice} の購読を開始`, ...l]);
  };

  const handleStart = async () => {
    await start(30);
    setLog((l) => ["録画を開始しました", ...l]);
  };

  const handleStop = async () => {
    await stop();
    setLog((l) => ["録画を停止しました", ...l]);

    // 録画期間の HR を相対時刻に整形し、JSON 保存
    if (startedAt != null) {
      const hrEvents = drain();
      const synced = syncHeartRates(startedAt, hrEvents);
      downloadJson(
        { device: selectedDevice, startedAt, hr: synced },
        `hr_${new Date().toISOString().replace(/[:.]/g, "-")}.json`
      );
      // 動画保存
      downloadWebM(chunks.map((c) => c.blob), `capture_${Date.now()}.webm`);
    }
  };

  const handlePreview = () => {
    // 簡易プレビュー（録画中に映像を表示したい場合は getDisplayMedia の stream を直接 <video> に紐付ける実装に変更）
    const blob = new Blob(chunks.map((c) => c.blob), { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.play();
    }
  };

  return (
    <main className="max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Screen × Heart Rate Sync (Next.js)</h1>

      <div className="mb-4 rounded-xl border p-4">
        <div className="mb-2 text-sm opacity-70">
          Socket: {connected ? "接続中" : "未接続"}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleRefresh} className="rounded bg-neutral-800 px-3 py-2 text-white">
            デバイス探索
          </button>

          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="rounded border px-2 py-2"
          >
            {CANDIDATE_DEVICES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <button onClick={handleSubscribe} className="rounded bg-blue-600 px-3 py-2 text-white">
            選択デバイスを購読
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-xl border p-4">
        <div className="mb-2 text-sm opacity-70">
          録画: {recording ? "録画中..." : "停止中"}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleStart}
            disabled={recording}
            className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-50"
          >
            画面キャプチャ開始
          </button>
          <button
            onClick={handleStop}
            disabled={!recording}
            className="rounded bg-red-600 px-3 py-2 text-white disabled:opacity-50"
          >
            停止 & 保存（動画+HR JSON）
          </button>
          <button
            onClick={handlePreview}
            disabled={chunks.length === 0}
            className="rounded bg-neutral-700 px-3 py-2 text-white disabled:opacity-50"
          >
            簡易プレビュー
          </button>
        </div>

        <div className="mt-3 text-sm">
          最新心拍: <span className="font-semibold">{latest ?? "--"} bpm</span>（購読開始後に更新）
        </div>

        <video ref={videoRef} className="mt-3 w-full rounded-lg" controls />
      </div>

      <div className="mb-4 rounded-xl border p-4">
        <div className="mb-2 text-sm font-medium">ログ</div>
        <ul className="space-y-1 text-sm">
          {log.map((line, i) => (
            <li key={i} className="font-mono opacity-80">• {line}</li>
          ))}
        </ul>
      </div>

      <HeartOverlay latest={latest} />
    </main>
  );
}
