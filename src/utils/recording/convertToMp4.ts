import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

export type ConversionProgress = {
  stage: "loading" | "converting" | "complete";
  progress: number;
  message: string;
};

/**
 * FFmpegインスタンスを初期化する
 */
const loadFFmpeg = async (
  onProgress?: (progress: ConversionProgress) => void
): Promise<FFmpeg> => {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  // ログを有効化
  ffmpeg.on("log", ({ message }) => {
    console.log("[FFmpeg]", message);
  });

  // 進捗状況を表示
  ffmpeg.on("progress", ({ progress }) => {
    const percent = Math.round(progress * 100);
    console.log(`[FFmpeg] 変換進捗: ${percent}%`);
    onProgress?.({
      stage: "converting",
      progress: percent,
      message: `動画を変換中... ${percent}%`,
    });
  });

  onProgress?.({
    stage: "loading",
    progress: 0,
    message: "FFmpegを読み込み中...",
  });

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });

    onProgress?.({
      stage: "loading",
      progress: 100,
      message: "FFmpegの読み込み完了",
    });
  } catch (error) {
    console.error("[FFmpeg] ロードエラー:", error);
    throw new Error(`FFmpegのロードに失敗しました: ${error}`);
  }

  return ffmpeg;
};

/**
 * WebM形式のBlobをMP4形式に変換する
 * @param webmBlob WebM形式のBlob
 * @param onProgress 進捗コールバック
 * @returns MP4形式のBlob
 */
export const convertWebMToMP4 = async (
  webmBlob: Blob,
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> => {
  const ffmpegInstance = await loadFFmpeg(onProgress);

  // 入力ファイル名と出力ファイル名
  const inputFileName = "input.webm";
  const outputFileName = "output.mp4";

  // WebM BlobをFFmpegのファイルシステムに書き込む
  await ffmpegInstance.writeFile(inputFileName, await fetchFile(webmBlob));

  // WebMからMP4に変換（最高速設定）
  await ffmpegInstance.exec([
    "-i",
    inputFileName,
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-tune",
    "zerolatency",
    "-crf",
    "32", // 画質を下げて速度アップ（28→32）
    "-maxrate",
    "2M", // ビットレート制限
    "-bufsize",
    "4M",
    "-r",
    "30", // フレームレート制限
    "-g",
    "60", // キーフレーム間隔
    "-threads",
    "0", // 自動的に最適なスレッド数を使用
    "-c:a",
    "aac",
    "-b:a",
    "96k", // オーディオビットレートを下げる（128k→96k）
    "-movflags",
    "+faststart",
    "-y", // 上書き確認なし
    outputFileName,
  ]);

  // 変換されたMP4ファイルを読み込む
  const data = await ffmpegInstance.readFile(outputFileName);

  // クリーンアップ
  await ffmpegInstance.deleteFile(inputFileName);
  await ffmpegInstance.deleteFile(outputFileName);

  onProgress?.({
    stage: "complete",
    progress: 100,
    message: "変換完了！",
  });

  // Uint8ArrayをBlobに変換
  return new Blob([new Uint8Array(data as Uint8Array)], { type: "video/mp4" });
};
