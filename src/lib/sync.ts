import type { HeartRateEvent, SyncedHeartRate } from "@/types/type"

/**
 * 録画開始 t0（performance.now）を基準に、HRイベントを相対化して整形
 */
export function syncHeartRates(
  t0: number,
  events: HeartRateEvent[]
): SyncedHeartRate[] {
  return events.map((e) => ({
    t: Math.max(0, Math.round(e.ts - t0)),
    hr: e.heartRate,
  }));
}

/** JSON ダウンロードユーティリティ */
export function downloadJson(obj: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** WebM 連結（単純 join は互換に注意。一般には単一 Blob の方が安全） */
export function downloadWebM(chunks: Blob[], filename: string) {
  const blob = new Blob(chunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
