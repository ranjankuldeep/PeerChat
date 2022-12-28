let localStream;
let remoteStream;

let init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  document.getElementById("user-1").srcObject = localStream;
  createOffer();
};
const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};
let createOffer = async () => {
  var peerConnection = new RTCPeerConnection(servers);
  //An object providing options to configure the new connection
  localStream
    .getTracks()
    .forEach((track) => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = (event) => {
    event.streams[0]
      .getTracks()
      .forEach((track) => remoteStream.addTrack(track));
  };
  remoteStream = new MediaStream();
  document.getElementById("user-2").srcObject = remoteStream;

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      console.log(event.candidate);
    }
  };
  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  console.log(offer);
};
init();
