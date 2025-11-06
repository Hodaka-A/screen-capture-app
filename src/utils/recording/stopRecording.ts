/** 
 * 録画を停止する
 * @param mediaRecorder  MediaRecorderのインスタンス
 */
export const stopRecording = (mediaRecorder: MediaRecorder) => {
  mediaRecorder.stop();
};
