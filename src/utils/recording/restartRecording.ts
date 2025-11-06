/** 
 * 録画を再開する
 * @param mediaRecorder  MediaRecorderのインスタンス
 */
export const restartRecording = (mediaRecorder: MediaRecorder) => {
  if (mediaRecorder.state === "recording") {
    // 記録を一時停止
    mediaRecorder.pause();
  }else if (mediaRecorder.state !== "paused") {
    console.warn("MediaRecorder is neither recording nor paused. Current state:", mediaRecorder.state);
    return;
  } 
  // 記録を再開
  mediaRecorder.resume();
};
