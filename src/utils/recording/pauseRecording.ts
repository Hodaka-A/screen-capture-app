/** 
 * 録画を一時停止する
 * @param mediaRecorder  MediaRecorderのインスタンス
 */
export const pauseRecording = (mediaRecorder: MediaRecorder) => {
  mediaRecorder.pause();
};
