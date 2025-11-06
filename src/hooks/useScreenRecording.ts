"use client";

import {
  downloadAsMP4,
  downloadAsWebM,
} from "@/utils/recording/download";
import { ConversionProgress } from "@/utils/recording/convertToMp4";
import { pauseRecording } from "@/utils/recording/pauseRecording";
import { restartRecording } from "@/utils/recording/restartRecording";
import { startRecording } from "@/utils/recording/startRecording";
import { stopRecording } from "@/utils/recording/stopRecording";
import { RefObject, useRef, useState } from "react";

/**
 * 画面録画を行うカスタムフック
 * @param stream  録画するMediaStream
 * @returns 録画の状態と操作関数
 */
export const useScreenRecording = (
  streamRef: RefObject<MediaStream | null>
) => {
  // 動画を一時停止しているかどうかの状態

  const [recording, setRecording] = useState(false);
  const [isStop, setIsStop] = useState<boolean>(false);
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);

  // 再レンダーで消えないように ref 化
  const chunksRef = useRef<Blob[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const mimeType = "video/webm;codecs=vp9,opus";

  const options: MediaRecorderOptions = {
    audioBitsPerSecond: 128000,
    videoBitsPerSecond: 2500000,
    mimeType: mimeType,
  };

  // 録画開始のロジック
  const handleStartRecording = () => {
    const stream = streamRef.current;
    if (!stream) {
      console.error(
        "MediaStream がありません。getDisplayMedia で取得してください。"
      );
      return;
    }

    // 前回の録画データをクリア
    chunksRef.current = [];
    console.log("[handleStartRecording] 録画データをクリア");

    if (!recorderRef.current) {
      try {
        recorderRef.current = new MediaRecorder(stream, options);
      } catch (e) {
        console.error("MediaRecorder の初期化に失敗しました:", e);
        return;
      }
    }
    // 既存ユーティリティをそのまま利用
    startRecording(recorderRef.current, chunksRef.current, mimeType);
    setIsStop(false);
    setRecording(true);

    recorderRef.current.onstop = () => {
      console.log("[onstop] 録画が停止されました");
      stream.getTracks().forEach((t) => t.stop());
      // recorderRefはダウンロード後にクリアする
      setRecording(false);
    };
  };

  // 録画停止のロジック
  const handleStopRecording = () => {
    if (!recorderRef.current) return;
    stopRecording(recorderRef.current);
    setRecording(false);
    // 録画停止後にダウンロードモーダルを表示
    setShowDownloadModal(true);
  };

  //   録画一時停止のロジック
  const handlePauseRecording = () => {
    if (!recorderRef.current) return;
    pauseRecording(recorderRef.current);
    setIsStop(true);
    setRecording(false);
  };

  //   録画再開のロジック
  const handleResumeRecording = () => {
    if (!recorderRef.current) return;
    restartRecording(recorderRef.current);
    setIsStop(false);
    setRecording(true);
  };

  // 録画保存のロジック
  const handleSaveRecording = () => {};

  // 録画データをMP4形式でダウンロード
  const handleDownloadAsMP4 = async (
    onProgress: (progress: ConversionProgress) => void
  ) => {
    console.log(`[handleDownloadAsMP4] chunks数: ${chunksRef.current.length}`);
    if (chunksRef.current.length === 0) {
      throw new Error("録画データがありません");
    }
    await downloadAsMP4(chunksRef.current, mimeType, onProgress);
  };

  // 録画データをWebM形式でダウンロード
  const handleDownloadAsWebM = () => {
    console.log(`[handleDownloadAsWebM] chunks数: ${chunksRef.current.length}`);
    if (chunksRef.current.length === 0) {
      throw new Error("録画データがありません");
    }
    downloadAsWebM(chunksRef.current, mimeType);
  };

  // ダウンロードモーダルを閉じる
  const handleCloseDownloadModal = () => {
    setShowDownloadModal(false);
    // 録画データとrecorderをクリア
    chunksRef.current = [];
    recorderRef.current = null;
    console.log("[handleCloseDownloadModal] 録画データをクリアしました");
  };

  return {
    isStop,
    recording,
    showDownloadModal,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleSaveRecording,
    handleDownloadAsMP4,
    handleDownloadAsWebM,
    handleCloseDownloadModal,
  };
};
