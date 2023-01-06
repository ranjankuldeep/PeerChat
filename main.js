let AppId = "a1938d9b3b484d9b86fccb0050fc034c";
//Agora App ID
let uid = String(Math.floor(Math.random() * 10000));
//Any random user id
let client;
let token = null;
//Used for authentication system

let localStream;
//Provide the media stream for local output
let remoteStream;
//Provide the media stream for remote output

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};
//FREE STUN SERVERS PROVIDED BY GOOGLE

let init = async () => {
  client = await AgoraRTM.createInstance(AppId);
  await client.login({ uid, token });

  channel = client.createChannel("main");
  await channel.join();
  channel.on("MemberJoined", handleUserJoined);
  client.on("MessageFromPeer", handleMessagePeer);
  //Handling events

  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  document.getElementById("user-1").srcObject = localStream;
  //Append the local stream to DOM
};
//FIRST function to be called
let handleMessagePeer = async (message, MemberId) => {
  message = JSON.parse(message.text);
  if (message.type === "offer") {
    createAnswer(MemberId, message.offer);
  }
  if (message.type === "answer") {
    addAnswer(message.answer);
  }
  if (message.type === "candidate") {
    if (peerConnection) {
      peerConnection.addIceCandidate(message.candidate);
    }
  }
};
let handleUserJoined = async (MemberId) => {
  createOffer(MemberId);
};

let createPeerConnection = async (MemberId) => {
  peerConnection = new RTCPeerConnection(servers);
  //An object providing options to configure the new connection
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  }
  localStream
    .getTracks()
    .forEach((track) => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = (event) => {
    console.log(event);
    event.streams[0].getTracks().forEach((track) => {
      console.log(track);
      remoteStream.addTrack(track, remoteStream);
    });
  };
  //This event will be fired for both the peers and u get the corresponding remote stream
  remoteStream = new MediaStream();
  document.getElementById("user-2").srcObject = remoteStream;

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      client.sendMessageToPeer(
        {
          text: JSON.stringify({
            type: "candidate",
            candidate: event.candidate,
          }),
        },
        MemberId
      );
    }
  };
};
let createOffer = async (MemberId) => {
  await createPeerConnection(MemberId);
  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  client.sendMessageToPeer(
    { text: JSON.stringify({ type: "offer", offer: offer }) },
    MemberId
  );
};
let createAnswer = async (MemberId, offer) => {
  await createPeerConnection(MemberId);
  await peerConnection.setRemoteDescription(offer);

  let answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  client.sendMessageToPeer(
    { text: JSON.stringify({ type: "answer", answer: answer }) },
    MemberId
  );
};
let addAnswer = async (answer) => {
  console.log(answer);
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(answer);
  }
};
init();
