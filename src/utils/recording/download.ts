import { convertWebMToMP4, ConversionProgress } from "./convertToMp4";

/**
 * 録画したデータをMP4形式でダウンロードする
 * @param chunks 録画データのBlob配列
 * @param mimeType WebMのMIMEタイプ
 * @param onProgress 進捗コールバック
 */
export const downloadAsMP4 = async (
  chunks: Blob[],
  mimeType: string,
  onProgress?: (progress: ConversionProgress) => void
) => {
  try {
    console.log(`[downloadAsMP4] chunks数: ${chunks.length}, mimeType: ${mimeType}`);

    if (chunks.length === 0) {
      throw new Error("録画データがありません。録画を開始してから停止してください。");
    }

    // Blobの配列から1つのBlobを作る（まとめる）
    const webmBlob = new Blob(chunks, { type: mimeType });
    console.log(`[downloadAsMP4] WebM Blobサイズ: ${webmBlob.size} bytes`);

    // WebMからMP4に変換
    console.log("動画をMP4形式に変換中...");
    const mp4Blob = await convertWebMToMP4(webmBlob, onProgress);
    console.log(`[downloadAsMP4] MP4 Blobサイズ: ${mp4Blob.size} bytes`);

    // ファイル名の文字列を作る
    const fileName = `ScreenRecording_${crypto.randomUUID()}.mp4`;

    // MP4ファイルを作成
    const file = new File([mp4Blob], fileName, { type: "video/mp4" });
    const url = URL.createObjectURL(file);

    // ファイルをダウンロードする
    const anchor = document.createElement("a");
    anchor.download = file.name;
    anchor.href = url;
    anchor.click();

    URL.revokeObjectURL(url);
    anchor.remove();

    console.log("MP4形式でのダウンロードが完了しました");
  } catch (error) {
    console.error("MP4変換中にエラーが発生しました:", error);
    throw error;
  }
};

/**
 * 録画したデータをWebM形式でそのままダウンロードする（変換なし）
 * @param chunks 録画データのBlob配列
 * @param mimeType WebMのMIMEタイプ
 */
export const downloadAsWebM = (chunks: Blob[], mimeType: string) => {
  try {
    console.log(`[downloadAsWebM] chunks数: ${chunks.length}, mimeType: ${mimeType}`);

    if (chunks.length === 0) {
      throw new Error("録画データがありません。録画を開始してから停止してください。");
    }

    // Blobの配列から1つのBlobを作る（まとめる）
    const webmBlob = new Blob(chunks, { type: mimeType });
    console.log(`[downloadAsWebM] WebM Blobサイズ: ${webmBlob.size} bytes`);

    // ファイル名の文字列を作る
    const fileName = `ScreenRecording_${crypto.randomUUID()}.webm`;

    // WebMファイルを作成
    const file = new File([webmBlob], fileName, { type: "video/webm" });
    const url = URL.createObjectURL(file);

    // ファイルをダウンロードする
    const anchor = document.createElement("a");
    anchor.download = file.name;
    anchor.href = url;
    anchor.click();

    URL.revokeObjectURL(url);
    anchor.remove();

    console.log("WebM形式でのダウンロードが完了しました");
  } catch (error) {
    console.error("ダウンロード中にエラーが発生しました:", error);
    throw error;
  }
};
