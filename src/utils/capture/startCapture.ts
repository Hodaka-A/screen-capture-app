/**
 * 画面キャプチャを開始する
 * @param videoElem キャプチャ映像を表示するためのHTMLVideoElement
 */
export const startCapture = async (
  videoElem: HTMLVideoElement
): Promise<MediaStream> => {
  const displayMediaOptions: DisplayMediaStreamOptions = {
    video: {
      // 共有画面選択時にタブを優先的に表示する
      displaySurface: "browser",
      frameRate: 60,
    },
    audio: true,
  };

  try {
    const captureStream = await navigator.mediaDevices.getDisplayMedia(
      displayMediaOptions
    );

    videoElem.srcObject = captureStream;
    await videoElem.play().catch(() => {});

    return captureStream;
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
};
