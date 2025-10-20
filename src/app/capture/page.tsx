"use client";

import { HeartOverlay } from "@/components/HeartOverlay";
import { useHeartRateStream } from "@/hooks/useHeartRateStream";
import { useScreenCapture } from "@/hooks/useScreenCapture";
import { useScreenRecording } from "@/hooks/useScreenRecording";
import { downloadJson, syncHeartRates } from "@/lib/sync";
import {
  Activity,
  Film,
  MonitorUp,
  Pause,
  Play,
  PlugZap,
  RefreshCcw,
  Square,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CANDIDATE_DEVICES = ["Polar Verity Sense"];

export default function Page() {
  const { connected, latest, drain, refreshDevices, subscribe } =
    useHeartRateStream();

  const {
    videoRef,
    streamRef,
    isCapture,
    error: captureError,
    startScreenCapture,
    stopScreenCapture,
  } = useScreenCapture();

  const {
    isStop,
    recording,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDownloadRecording,
  } = useScreenRecording(streamRef);

  const [selectedDevice, setSelectedDevice] = useState(CANDIDATE_DEVICES[0]);
  const [log, setLog] = useState<string[]>([]);
  const previewRef = useRef<HTMLVideoElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);

  // stream を video に結線
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = (isCapture ? streamRef.current : null) as MediaStream | null;
    return () => {
      el.srcObject = null;
    };
  }, [isCapture, streamRef, videoRef]);

  // デバイス探索 / 購読
  const handleRefresh = async () => {
    await refreshDevices();
    setLog((l) => ["デバイス探索リクエストを送信しました（一覧はSocketで通知）", ...l]);
  };

  const handleSubscribeDevice = async () => {
    if (!selectedDevice) return;
    await subscribe(selectedDevice);
    setLog((l) => [`${selectedDevice} の購読を開始`, ...l]);
  };

  // 共有→録画を1クリック開始
  const handleStartOneClick = async () => {
    try {
      if (!isCapture) {
        await startScreenCapture();
        setLog((l) => ["画面キャプチャを開始しました", ...l]);
      }
      if (!streamRef.current) {
        setLog((l) => ["ストリームが取得できませんでした", ...l]);
        return;
      }

  handleStartRecording();
  // 録画開始時のタイムスタンプ（performance.now ベース）を記録
  setRecordingStartedAt(performance.now());
  setLog((l) => ["画面共有 + 録画を同時に開始しました", ...l]);

      const [vtrack] = streamRef.current.getVideoTracks();
      vtrack?.addEventListener(
        "ended",
        () => {
          handleStopAndSave().catch(() => {});
        },
        { once: true }
      );
    } catch (e) {
      setLog((l) => [`開始エラー: ${String((e as Error).message ?? e)}`, ...l]);
    }
  };

  // 停止 & 保存（動画 + HR JSON）
  const handleStopAndSave = async () => {
    try {
      const res = await handleStopRecording();
      setLog((l) => ["録画を停止しました", ...l]);

      // HR 同期（録画開始からの再生時間で同期）
      const hrEvents = drain();
      // use recordingStartedAt (performance.now) as t0; fallback to first event ts or performance.now
      const t0 = recordingStartedAt ?? (hrEvents.length ? hrEvents[0].ts : performance.now());
      const synced = syncHeartRates(t0, hrEvents);
      // convert t0 (performance.now relative to now) to a Date for ISO
      const startedAtDate = new Date(Date.now() - (performance.now() - t0));
      downloadJson(
        { device: selectedDevice, startedAt: startedAtDate.toISOString(), hr: synced },
        `hr_${new Date().toISOString().replace(/[:.]/g, "-")}.json`
      );

      // 動画DL
      await handleDownloadRecording();
      setLog((l) => ["動画とHR JSONを保存しました", ...l]);

      const resAny = res as unknown as { url?: string } | undefined;
      if (resAny && resAny.url) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(resAny.url);
      }
    } catch (e) {
      setLog((l) => [`停止時エラー: ${String((e as Error).message ?? e)}`, ...l]);
    } finally {
      if (isCapture) {
        await stopScreenCapture();
        setLog((l) => ["画面キャプチャを停止しました", ...l]);
      }
    }
  };

  // プレビューURL解放
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* ヘッダー（YouTube風バッジ） */}
      <header className="mx-auto w-full max-w-6xl px-4 pt-8 pb-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600 shadow-sm">
            <Film className="h-3.5 w-3.5 text-gray-500" />
            Screen × Heart Rate Sync
          </div>
        </div>
      </header>

      {/* コンテンツ：YouTube風 2カラム（左ワイド / 右サイド） */}
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 pb-12 md:grid-cols-12">
        {/* 左：大きなプレイヤー領域（md: 8, lg: 9） */}
        <section className="md:col-span-8 lg:col-span-9">
          {/* 大きな16:9プレイヤー */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-black">
            <div className="relative aspect-video">
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-contain"
                autoPlay
                muted
                playsInline
              />
            </div>
          </div>

          {/* タイトル行（YouTube風） */}
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">画面キャプチャ・プレビュー</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">
                  <PlugZap className={`h-5.5 w-5.5 ${connected ? "text-gray-700" : "text-gray-400"}`} />
                  Socket: {connected ? "接続中" : "未接続"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">
                  <MonitorUp className={`h-5.5 w-5.5 ${recording ? "text-gray-700" : "text-gray-400"}`} />
                  画面共有: {recording ? "共有中" : "停止中"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">
                  <Activity className="h-5.5 w-5.5 text-gray-500" />
                  最新心拍: <span className="ml-1 font-semibold text-gray-800">{latest ?? "--"} bpm</span>
                </span>
              </div>
            </div>
          </div>

          {/* 録画コントロール（大きめボタン / YouTube下の行を意識） */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {/* 録画開始⇄停止（トグル） */}
            <button
              onClick={recording ? handleStopAndSave : handleStartOneClick}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium shadow-sm hover:cursor-pointer disabled:cursor-not-allowed transition
              ${recording ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-900 hover:bg-gray-800 text-white"}`}
              aria-label={recording ? "録画終了" : "録画開始"}
            >
              {recording ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {recording ? "録画終了" : "録画開始"}
            </button>

            {/* 一時停止⇄再開（トグル） */}
            <button
              onClick={isStop ? handleResumeRecording : handlePauseRecording}
              className="inline-flex items-center gap-2 rounded-full bg-gray-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-500 disabled:opacity-50 hover:cursor-pointer disabled:cursor-not-allowed transition"
              aria-label={isStop ? "録画再開" : "一時停止"}
            >
              {isStop ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {isStop ? "録画再開" : "一時停止"}
            </button>

            {/* 画面共有トグル */}
            <button
              onClick={isCapture ? stopScreenCapture : startScreenCapture}
              className="inline-flex items-center gap-2 rounded-full bg-gray-500 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-400 transition hover:cursor-pointer"
            >
              <MonitorUp className="h-4 w-4" />
              {isCapture ? "共有停止" : "画面キャプチャ開始"}
            </button>
          </div>

          {/* 録画プレビュー（あれば下に表示） */}
          {previewUrl && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm text-gray-600">録画プレビュー</h2>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <video ref={previewRef} src={previewUrl} className="w-full" controls />
              </div>
            </div>
          )}
        </section>

        {/* 右：サイドパネル（md: 4, lg: 3） */}
        <aside className="md:col-span-4 lg:col-span-3 flex flex-col gap-6">
          {/* デバイス・接続カード */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <div className="mb-3 text-sm text-gray-600">デバイス & 接続</div>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition hover:cursor-pointer"
              >
                <RefreshCcw className="h-4 w-4 text-gray-600" />
                デバイス探索
              </button>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none ring-0 focus:border-gray-400"
              >
                {CANDIDATE_DEVICES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSubscribeDevice}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition hover:cursor-pointer"
              >
                <PlugZap className="h-4 w-4 text-gray-600" />
                接続
              </button>
            </div>

            {isCapture ? (
              <p className="mt-3 text-xs text-gray-600">共有中の映像を録画する準備ができています。</p>
            ) : (
              <p className="mt-3 text-xs text-gray-500">画面キャプチャを開始してから録画できます。</p>
            )}

            {captureError && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                Capture Error: {String(captureError)}
              </p>
            )}
          </div>

          {/* ログカード */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <div className="mb-2 text-sm text-gray-600">ログ</div>
            <ul className="max-h-64 space-y-1 overflow-auto rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-800">
              {log.length === 0 ? (
                <li className="opacity-60">ログはまだありません</li>
              ) : (
                log.map((line, i) => (
                  <li key={i} className="font-mono">
                    • {line}
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </div>

      <HeartOverlay latest={latest} />
    </main>
  );
}
