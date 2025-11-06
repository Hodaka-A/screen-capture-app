/**
 * 画面キャプチャを終了する
 * @param videoElem - キャプチャを表示しているvideo要素
 */
export const stopCapture = (videoElem: HTMLVideoElement) => {
  const stream = videoElem.srcObject;

  if (stream instanceof MediaStream) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }

  videoElem.srcObject = null;
};
