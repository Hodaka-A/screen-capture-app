"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, X, AlertCircle, Loader2, FileVideo } from "lucide-react";
import { useState } from "react";
import { ConversionProgress } from "@/utils/recording/convertToMp4";

interface RecordingCompleteModalProps {
  open: boolean;
  onDownloadMP4: (
    onProgress: (progress: ConversionProgress) => void
  ) => Promise<void>;
  onDownloadWebM: () => void;
  onClose: () => void;
}

export function RecordingCompleteModal({
  open,
  onDownloadMP4,
  onDownloadWebM,
  onClose,
}: RecordingCompleteModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadMP4 = async () => {
    try {
      setIsDownloading(true);
      setError(null);
      setProgress({ stage: "loading", progress: 0, message: "準備中..." });

      await onDownloadMP4((prog) => {
        setProgress(prog);
      });

      // 完了後に少し待ってから閉じる
      setTimeout(() => {
        onClose();
        setProgress(null);
      }, 1000);
    } catch (error) {
      console.error("ダウンロード中にエラーが発生しました:", error);
      setError(
        error instanceof Error ? error.message : "ダウンロードに失敗しました"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadWebM = () => {
    try {
      onDownloadWebM();
      onClose();
    } catch (error) {
      console.error("ダウンロード中にエラーが発生しました:", error);
      setError(
        error instanceof Error ? error.message : "ダウンロードに失敗しました"
      );
    }
  };

  const handleClose = () => {
    if (!isDownloading) {
      setProgress(null);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>録画が完了しました</DialogTitle>
          <DialogDescription>
            録画したビデオをダウンロードしますか？
          </DialogDescription>
        </DialogHeader>

        {/* 進捗表示 */}
        {isDownloading && progress && (
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{progress.message}</span>
            </div>
            <Progress value={progress.progress} className="h-2" />
            <p className="text-xs text-gray-500 text-center">
              {progress.progress}%
            </p>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">エラーが発生しました</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          </div>
        )}

        {!isDownloading && (
          <>
            <div className="space-y-2 py-2">
              <p className="text-sm text-gray-600">
                <strong>MP4形式</strong>: 互換性が高く、ほとんどのデバイスで再生可能（変換に時間がかかります）
              </p>
              <p className="text-sm text-gray-600">
                <strong>WebM形式</strong>: 変換なしで即座にダウンロード（一部のデバイスでは再生できない場合があります）
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadWebM}
                  className="w-full"
                >
                  <FileVideo className="mr-2 h-4 w-4" />
                  WebM
                </Button>
                <Button onClick={handleDownloadMP4} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  MP4
                </Button>
              </div>
              <Button variant="outline" onClick={handleClose} className="w-full">
                <X className="mr-2 h-4 w-4" />
                キャンセル
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
