export type DeviceName = string;

export type HeartRateEvent = {
  devName: DeviceName;
  heartRate: number;
  ts: number; // クライアント受信時の高精度タイムスタンプ (ms)
};

export type RecordingChunk = {
  ts: number; // chunk 受領時（ms）
  blob: Blob;
};

export type SyncedHeartRate = {
  t: number; // 録画開始からの相対 ms
  hr: number;
};

export type RecordingHandle = {
  mediaRecorder: MediaRecorder;
  chunks: Blob[];
  mimeType: string;
};

