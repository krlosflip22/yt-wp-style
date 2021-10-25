const State = {
  Unstarted: 1,
  Ready: 2,
  Play: 3,
  Pause: 4,
  Buffer: 5,
  VideoCued: 6,
  Ended: 7,
};
const Command = {
  LoadVideo: 1,
  PlayVideo: 2,
  PauseVideo: 3,
  SeekTime: 4,
  ChangeVolume: 5,
};

function LogText(text)
{
  // document.getElementById("debugText").textContent=text;
  console.log(text);
}

function YouTubeWebMessage(videoId, seconds,videoDuration,volume, stateOrCommand) {
  this.videoId = videoId;
  this.seconds = seconds;
  this.videoDuration = videoDuration;
  this.volume = volume;
  this.stateOrCommand = stateOrCommand;
}

var youtubePlayer;
var state;
var currentVideoId;
var pauseCover;

function onYouTubeIframeAPIReady() {
  LogText("Youtube Iframe ready");
  pauseCover = document.getElementById("pause-cover");
  youtubePlayer = new YT.Player("player", {
    height: window.innerHeight,
    width: window.innerWidth,
    // videoId: currentVideoId,
    playerVars: {
      'controls': 0, 
      'rel' : 0,
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
    },
  });
}

function LoadVideo(videoId, startSeconds) {
  if (videoId !== "") document.getElementById("cover").style.display = "none";
  LogText("Loading video");
  currentVideoId = videoId;
  youtubePlayer.loadVideoById(videoId, startSeconds);
}

function PlayOrPause()
{
  if (state === State.Play) PauseVideo();
  else PlayVideo();
}

function PlayVideo() {
  LogText("Playing video");
  youtubePlayer.playVideo();
}

function PauseVideo() {
  LogText("Pausing video");
  youtubePlayer.pauseVideo();
}

function SeekTime(seconds) {
  LogText("Seeking time");
  youtubePlayer.seekTo(seconds, true);
}

function ChangeVolume(volume) {
  youtubePlayer.setVolume(volume);
}

function GetCurrentVolume(){
  return youtubePlayer.getVolume();
}

function GetCurrentTime() {
  return youtubePlayer.getCurrentTime();
}

function GetVideoDuration() {
  return youtubePlayer.getDuration();
}

function GetVideoId(){
  return currentVideoId;
}

var hasBeenInit = false;
function onPlayerReady(event) {
  LogText("player ready");
  if (window.vuplex) {
    state = State.Ready;
    PostMessage(GetVideoId(),GetCurrentTime(),GetVideoDuration(),GetCurrentVolume(),state);
  }

  if(!hasBeenInit)
  {
    hasBeenInit = true;
    setTimeout(CoroutinePostCurrentInformation,250);
  }
}


function onPlayerStateChange(event) {
  WaitForDisablePauseCover();
  switch (event.data) {
    case YT.PlayerState.UNSTARTED:
      state = State.Unstarted;
      break;
    case YT.PlayerState.PLAYING:
      state = State.Play;
      break;
    case YT.PlayerState.PAUSED:
      pauseCover.style.display = "block";
      state = State.Pause;
      break;
    case YT.PlayerState.BUFFERING:
      state = State.Buffer;
      break;
    case YT.PlayerState.VIDEOCUED:
      state = State.VideoCued;
      break;
    case YT.PlayerState.ENDED:
      state = State.Ended;
      break;
  }
  PostMessage(GetVideoId(),GetCurrentTime(),GetVideoDuration(),GetCurrentVolume(),state);
}

function WaitForDisablePauseCover() {
  if (pauseCover.style.display === 'none') return;
  setTimeout(() => {
    pauseCover.style.display = "none";
  }, 250);
}

function PostMessage(videoUrl, seconds, videoDuration, volume, currentState){
  let ytWebMessage = new YouTubeWebMessage(videoUrl, seconds, videoDuration, volume, currentState);

  if (window.vuplex) {
    window.vuplex.postMessage(ytWebMessage);
  }
  else{
    LogText(ytWebMessage);
  }
}

//From C# to JS
function OnUnityMsgReceived(videoId,seconds,volume,stateOrCommand) {
  LogText('Message received');

  switch (stateOrCommand) {
    case Command.LoadVideo:
      LogText('Received load');
      LoadVideo(videoId, seconds);
      break;
    case Command.PlayVideo:
      LogText('Received play');
      var superButton = document.getElementById('superButton');
      superButton.onclick();
      break;
    case Command.PauseVideo:
      LogText('Received pause');
      PauseVideo();
      break;
    case Command.SeekTime:
      LogText('Received seek');
      SeekTime(seconds);
      break;
    case Command.ChangeVolume:
      ChangeVolume(volume);
      break;
  }

  return 'message received';
}

function CoroutinePostCurrentInformation(){
  PostMessage(GetVideoId(),GetCurrentTime(),GetVideoDuration(),GetCurrentVolume(),state)
  setTimeout(CoroutinePostCurrentInformation,333); //Send current information every third of a second.
}
