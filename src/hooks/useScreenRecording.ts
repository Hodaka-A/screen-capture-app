"use client";

import { download } from "@/utlils/recording/download";
import { pauseRecording } from "@/utlils/recording/pauseRecording";
import { restartRecording } from "@/utlils/recording/restartRecording";
import { startRecording } from "@/utlils/recording/startRecording";
import { stopRecording } from "@/utlils/recording/stopRecording";
import { RefObject, useRef, useState } from "react";

/**
 * 画面録画を行うカスタムフック
 * @param stream  録画するMediaStream
 * @returns 録画の状態と操作関数
 */
export const useScreenRecording = (streamRef: RefObject<MediaStream | null>) => {
  // 動画を一時停止しているかどうかの状態
  
const [recording, setRecording] = useState(false);
  const [isStop, setIsStop] = useState<boolean>(false);

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
    const stream=streamRef.current;
    if (!stream) {
      console.error(
        "MediaStream がありません。getDisplayMedia で取得してください。"
      );
      return;
    }
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
      stream.getTracks().forEach((t) => t.stop());
       recorderRef.current = null;
        setRecording(false);
    };
  };

  // 録画停止のロジック
  const handleStopRecording = () => {
    if (!recorderRef.current) return;
    stopRecording(recorderRef.current);
    setRecording(false);
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

  // 録画データのダウンロード
  const handleDownloadRecording = () => {
    if (!recorderRef.current) return;
    download(recorderRef.current, chunksRef.current);
  };

  return {
    isStop,
    recording,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleSaveRecording,
    handleDownloadRecording,
  };
};
