var audioPlayer;

export function play() {
  audioPlayer.play();
}

export function pause() {
  audioPlayer.pause();
}

export function getCurrentTime() {
  return audioPlayer.currentTime;
}

export function setCurrentTime(time) {
  audioPlayer.currentTime = time;
}

export function init() {
  audioPlayer = document.getElementsByTagName('audio')[0];
}
