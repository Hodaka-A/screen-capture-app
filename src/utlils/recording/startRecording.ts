/**
 * 録画を開始する
 * @param mediaRecorder MediaRecorder のインスタンス
 * @param chunks Blob 配列（録画データの蓄積先）
 * @param mimeType 使用する MIME タイプ
 */
export const startRecording = (
  mediaRecorder: MediaRecorder,
  chunks: Blob[],
  mimeType: string
) => {
  mediaRecorder.ondataavailable = (ev: BlobEvent) => {
    if (ev.data && ev.data.size > 0) chunks.push(ev.data);
  };

  try {
    mediaRecorder.start(1000);
  } catch (error) {
    console.error("録画の開始に失敗しました:", error);
    throw error;
  }

  return { mediaRecorder, chunks, mimeType };
};