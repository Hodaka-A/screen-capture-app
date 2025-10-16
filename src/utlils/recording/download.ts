/**
 * 録画したデータをダウンロードする
 * @param mediaRecorder  MediaRecorderのインスタンス
 * @param chunks 録画データのBlob配列
 */
export const download = (mediaRecorder: MediaRecorder, chunks: Blob[]) => {
  const extensions = new Map([
    ["video/x-matroska", "mkv"],
    ["video/webm", "webm"],
    ["video/mp4", "mp4"],
  ]);

  const getExtensionFromMimeType = (mimeType: string): string => {
    const key = mimeType.split(";")[0];
    return extensions.get(key) ?? "webm";
  };
  // ファイル名の文字列を作る
  const extension = getExtensionFromMimeType(mediaRecorder.mimeType);
  const fileName = `ScreenRecording_${crypto.randomUUID()}.${extension}`;

  // Blob の配列から 1 つの File を作る（まとめる）
  const file = new File(chunks, fileName, { type: mediaRecorder.mimeType });
  const url = URL.createObjectURL(file);

  // ファイルをダウンロードする
  const anchor = document.createElement("a");
  anchor.download = file.name;
  anchor.href = url;
  anchor.click();

  URL.revokeObjectURL(url);
  anchor.remove();
};
