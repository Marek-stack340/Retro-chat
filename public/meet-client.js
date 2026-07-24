// ODDYCH MEET CLIENT
const socket = io();

const STUN = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
};

let roomId = null;
let displayName = localStorage.getItem('chatUsername')?.trim() || 'Hosť';
let localStream = null;
let micOn = true;
let camOn = true;
const peers = new Map(); // peerId → { pc, pendingCandidates }

// DOM
const lobbyEl = document.getElementById('lobby');
const meetingEl = document.getElementById('meeting');
const displayNameInput = document.getElementById('display-name');
const roomCodeInput = document.getElementById('room-code');
const joinBtn = document.getElementById('join-btn');
const newMeetingBtn = document.getElementById('new-meeting-btn');
const videosGrid = document.getElementById('videos-grid');
const participantCount = document.getElementById('participant-count');
const roomLabel = document.getElementById('room-label');
const toggleMic = document.getElementById('toggle-mic');
const toggleCam = document.getElementById('toggle-cam');
const leaveBtn = document.getElementById('leave-btn');
const copyLinkBtn = document.getElementById('copy-link-btn');

// Pre-fill name
displayNameInput.value = displayName;

// Check URL for room param
const urlParams = new URLSearchParams(window.location.search);
const urlRoom = urlParams.get('room');
if (urlRoom) roomCodeInput.value = urlRoom;

// --- LOBBY ---
newMeetingBtn.addEventListener('click', () => {
  const code = Math.random().toString(36).slice(2, 8);
  roomCodeInput.value = code;
});

joinBtn.addEventListener('click', () => startMeeting());
roomCodeInput.addEventListener('keydown', e => { if (e.key === 'Enter') startMeeting(); });
displayNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') startMeeting(); });

async function startMeeting() {
  const name = displayNameInput.value.trim() || 'Hosť';
  const code = roomCodeInput.value.trim().replace(/\s+/g, '-').toLowerCase();
  if (!code) { roomCodeInput.focus(); return; }
  displayName = name;
  roomId = code;

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  } catch (e) {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    } catch (e2) {
      alert('Kamera/mikrofón nie sú dostupné. Skontroluj povolenia.');
      return;
    }
  }

  lobbyEl.classList.add('hidden');
  meetingEl.classList.remove('hidden');

  roomLabel.textContent = `Kód: ${roomId}`;
  addLocalTile();
  socket.emit('meet:join', { roomId, displayName });
}

// --- VIDEO TILES ---
function addLocalTile() {
  const tile = createTile('local', `${displayName} (Ty)`);
  const video = tile.querySelector('video');
  video.srcObject = localStream;
  video.muted = true;
  video.play().catch(() => {});
  videosGrid.appendChild(tile);
  updateGrid();
}

function createTile(id, name) {
  const tile = document.createElement('div');
  tile.className = 'video-tile';
  tile.id = `tile-${id}`;
  tile.innerHTML = `
    <video autoplay playsinline></video>
    <div class="no-video" id="novideo-${id}"><span>👤</span><span>${escHtml(name)}</span></div>
    <div class="tile-name">${escHtml(name)}</div>
    <div class="tile-muted" id="muted-${id}" style="display:none">🔇</div>
  `;
  return tile;
}

function addRemoteTile(peerId, peerName) {
  if (document.getElementById(`tile-${peerId}`)) return;
  const tile = createTile(peerId, peerName);
  videosGrid.appendChild(tile);
  updateGrid();
}

function removeRemoteTile(peerId) {
  const tile = document.getElementById(`tile-${peerId}`);
  if (tile) tile.remove();
  updateGrid();
}

function attachRemoteStream(peerId, stream) {
  const tile = document.getElementById(`tile-${peerId}`);
  if (!tile) return;
  const video = tile.querySelector('video');
  const noVideo = document.getElementById(`novideo-${peerId}`);
  if (stream.getVideoTracks().length > 0) {
    video.srcObject = stream;
    video.play().catch(() => {});
    if (noVideo) noVideo.style.display = 'none';
  } else {
    if (noVideo) noVideo.style.display = '';
  }
}

function updateGrid() {
  const count = videosGrid.children.length;
  videosGrid.className = 'videos-grid';
  if (count === 2) videosGrid.classList.add('grid-2');
  else if (count === 3) videosGrid.classList.add('grid-3');
  else if (count === 4) videosGrid.classList.add('grid-4');
  else if (count > 4) videosGrid.classList.add('grid-many');

  const n = count;
  participantCount.textContent = `${n} účastník${n === 1 ? '' : n < 5 ? 'i' : 'ov'}`;
}

// --- WEBRTC ---
async function createPeerConnection(peerId, peerName, isInitiator) {
  const pc = new RTCPeerConnection(STUN);
  const state = { pc, pendingCandidates: [] };
  peers.set(peerId, state);

  if (localStream) {
    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
  }

  const remoteStream = new MediaStream();
  pc.ontrack = (e) => {
    e.streams[0].getTracks().forEach(t => remoteStream.addTrack(t));
    attachRemoteStream(peerId, remoteStream);
  };

  pc.onicecandidate = ({ candidate }) => {
    if (candidate) socket.emit('meet:ice', { to: peerId, candidate });
  };

  pc.oniceconnectionstatechange = () => {
    if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
      removeRemoteTile(peerId);
      peers.delete(peerId);
    }
  };

  if (isInitiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('meet:offer', { to: peerId, sdp: offer, roomId });
  }

  addRemoteTile(peerId, peerName);
  return pc;
}

// --- SOCKET EVENTS ---
socket.on('meet:existing', async (participants) => {
  for (const p of participants) {
    await createPeerConnection(p.id, p.name, true);
  }
});

socket.on('meet:participant-joined', async ({ id, name }) => {
  if (!peers.has(id)) {
    await createPeerConnection(id, name, false);
  }
});

socket.on('meet:offer', async ({ from, fromName, sdp }) => {
  let state = peers.get(from);
  if (!state) {
    const pc = await createPeerConnection(from, fromName, false);
    state = peers.get(from);
  }
  const { pc, pendingCandidates } = state;
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  for (const c of pendingCandidates) {
    try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
  }
  state.pendingCandidates = [];
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('meet:answer', { to: from, sdp: answer });
});

socket.on('meet:answer', async ({ from, sdp }) => {
  const state = peers.get(from);
  if (!state) return;
  await state.pc.setRemoteDescription(new RTCSessionDescription(sdp));
  for (const c of state.pendingCandidates) {
    try { await state.pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
  }
  state.pendingCandidates = [];
});

socket.on('meet:ice', async ({ from, candidate }) => {
  const state = peers.get(from);
  if (!state) return;
  if (!state.pc.remoteDescription) {
    state.pendingCandidates.push(candidate);
    return;
  }
  try { await state.pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {}
});

socket.on('meet:participant-left', ({ id }) => {
  const state = peers.get(id);
  if (state) { state.pc.close(); peers.delete(id); }
  removeRemoteTile(id);
});

// --- CONTROLS ---
toggleMic.addEventListener('click', () => {
  micOn = !micOn;
  localStream?.getAudioTracks().forEach(t => { t.enabled = micOn; });
  toggleMic.textContent = micOn ? '🎤' : '🔇';
  toggleMic.classList.toggle('muted', !micOn);
});

toggleCam.addEventListener('click', () => {
  camOn = !camOn;
  localStream?.getVideoTracks().forEach(t => { t.enabled = camOn; });
  toggleCam.textContent = camOn ? '📷' : '🚫';
  toggleCam.classList.toggle('muted', !camOn);
  const noVideo = document.getElementById('novideo-local');
  if (noVideo) noVideo.style.display = camOn ? 'none' : '';
});

leaveBtn.addEventListener('click', leaveMeeting);

function leaveMeeting() {
  if (roomId) socket.emit('meet:leave', { roomId });
  localStream?.getTracks().forEach(t => t.stop());
  peers.forEach(({ pc }) => pc.close());
  peers.clear();
  videosGrid.innerHTML = '';
  roomId = null;
  localStream = null;
  micOn = true;
  camOn = true;
  toggleMic.textContent = '🎤';
  toggleMic.classList.remove('muted');
  toggleCam.textContent = '📷';
  toggleCam.classList.remove('muted');
  meetingEl.classList.add('hidden');
  lobbyEl.classList.remove('hidden');
}

copyLinkBtn.addEventListener('click', async () => {
  const url = `${location.origin}/meet.html?room=${roomId}`;
  try {
    await navigator.clipboard.writeText(url);
    copyLinkBtn.textContent = '✅';
    setTimeout(() => { copyLinkBtn.textContent = '🔗'; }, 2000);
  } catch (_) {
    prompt('Skopíruj link:', url);
  }
});

function escHtml(s) {
  return (s || '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}
