var audioPlayer;

export function play() {
  if (audioPlayer) audioPlayer.play();
}

export function pause() {
  if (audioPlayer) audioPlayer.pause();
}

export function getCurrentTime() {
  return audioPlayer.currentTime;
}

export function setCurrentTime(time) {
  if (audioPlayer) audioPlayer.currentTime = time;
}

export function getSpeed() {
  return audioPlayer.playbackRate;
}

export function setSpeed(rate) {
  if (audioPlayer) audioPlayer.playbackRate = rate;
}

export function init() {
  audioPlayer = document.getElementsByTagName('audio')[0];
}
