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

export function getSpeed() {
  return audioPlayer.playbackRate;
}

export function setSpeed(rate) {
  audioPlayer.playbackRate = rate;
}

export function init() {
  audioPlayer = document.getElementsByTagName('audio')[0];
}
