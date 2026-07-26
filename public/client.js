const socket = io();
const messagesDiv = document.getElementById('messages');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const activeUsersCount = document.getElementById('active-users-count');
const usersList = document.getElementById('users-list');
const currentUsernameDisplay = document.getElementById('current-username-display');
const navLogout = document.getElementById('nav-logout');
const navHelp = document.getElementById('nav-help');
const navProfile = document.getElementById('nav-profile');
const navFriends = document.getElementById('nav-friends');
const navIgnore = document.getElementById('nav-ignore');
const navSettings = document.getElementById('nav-settings');
const navQuicklink = document.getElementById('nav-quicklink');
const navMessenger = document.getElementById('nav-messenger');
const chatApp = document.querySelector('.chat-app');
const newsHistoryToggle = document.getElementById('news-history-toggle');
const newsHistoryPanel = document.getElementById('news-history-panel');
const newsHistoryClose = document.getElementById('news-history-close');
const newsHistoryBackdrop = document.getElementById('news-history-backdrop');

const privateStatus = document.getElementById('private-status');
const privateTargetNameDisplay = document.getElementById('private-target-name');

// Nastavenia odosielania
const sendSettingsModal = document.getElementById('send-settings-modal');
const sendSettingsPrivateToggle = document.getElementById('send-settings-private-toggle');
const sendSettingsTarget = document.getElementById('send-settings-target');
const sendSettingsSave = document.getElementById('send-settings-save');
const sendSettingsCancel = document.getElementById('send-settings-cancel');

// VOLANIE
const callActiveBar = document.getElementById('call-active-bar');
const callPeerName = document.getElementById('call-peer-name');
const callTimer = document.getElementById('call-timer');
const callHangupBtn = document.getElementById('call-hangup-btn');
const callIncomingBar = document.getElementById('call-incoming-bar');
const callCallerName = document.getElementById('call-caller-name');
const callAcceptBtn = document.getElementById('call-accept-btn');
const callRejectBtn = document.getElementById('call-reject-btn');
const remoteAudio = document.getElementById('remote-audio');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownValueEl = document.getElementById('countdown-value');
const countdownLabelEl = document.getElementById('countdown-label');

let callState = null;
let pendingCall = null;
let pendingIceCandidates = [];
let publicMessageHistory = [];
let currentRoom = normalizeRoomName(localStorage.getItem('chatCurrentRoom') || 'Spoločná');
let lastClearTime = Number(localStorage.getItem('chatClearAt') || 0) || 0;
let countdownState = null;
let kozaModeEnabled = false;

const STUN = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

async function startLocalStream() {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch (e) {
    addMessage({ system: true, text: '⚠ Mikrofón nie je dostupný. Skontroluj povolenia prehliadača.', timestamp: new Date().toISOString() });
    return null;
  }
}

function createPeerConnection(peerId) {
  const pc = new RTCPeerConnection(STUN);
  pc.onicecandidate = ({ candidate }) => {
    if (candidate) socket.emit('call:ice', { peerId, candidate });
  };
  pc.ontrack = (e) => {
    if (remoteAudio && e.streams && e.streams[0]) {
      remoteAudio.srcObject = e.streams[0];
      remoteAudio.play().catch(() => {});
    }
  };
  return pc;
}

function startCallTimer() {
  let sec = 0;
  callTimer.textContent = '0:00';
  return setInterval(() => {
    sec++;
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, '0');
    callTimer.textContent = `${m}:${s}`;
  }, 1000);
}

function endCall(reason) {
  if (!callState) return;
  clearInterval(callState.timerInterval);
  if (callState.localStream) callState.localStream.getTracks().forEach(t => t.stop());
  if (callState.pc) callState.pc.close();
  if (remoteAudio) { remoteAudio.srcObject = null; }
  callActiveBar.style.display = 'none';
  pendingIceCandidates = [];
  if (reason) addMessage({ system: true, text: `📵 ${reason}`, timestamp: new Date().toISOString() });
  callState = null;
}

// Volajúci: len pošle pozvánku, PC sa vytvorí až po prijatí
async function initiateCall(peerId, peerName) {
  if (callState) return addMessage({ system: true, text: '⚠ Už si na hovore.', timestamp: new Date().toISOString() });
  callState = { peerId, peerName, pc: null, localStream: null, timerInterval: null, isInitiator: true };
  socket.emit('call:invite', peerId);
  addMessage({ system: true, text: `📞 Volám ${peerName}...`, timestamp: new Date().toISOString() });
}

callHangupBtn?.addEventListener('click', () => {
  if (callState) {
    socket.emit('call:hangup', { peerId: callState.peerId });
    endCall('Hovor ukončený.');
  }
});

// Volaný: prijme hovor, čaká na offer
callAcceptBtn?.addEventListener('click', async () => {
  if (!pendingCall) return;
  callIncomingBar.style.display = 'none';
  const { callerId, callerName } = pendingCall;
  pendingCall = null;
  socket.emit('call:accept', { callerId });
  callState = { peerId: callerId, peerName: callerName, pc: null, localStream: null, timerInterval: null, isInitiator: false };
  addMessage({ system: true, text: `✅ Prijatý hovor od ${callerName}, čakám na spojenie...`, timestamp: new Date().toISOString() });
});

callRejectBtn?.addEventListener('click', () => {
  if (!pendingCall) return;
  socket.emit('call:reject', { callerId: pendingCall.callerId });
  addMessage({ system: true, text: `📵 Odmietnutý hovor od ${pendingCall.callerName}.`, timestamp: new Date().toISOString() });
  callIncomingBar.style.display = 'none';
  pendingCall = null;
});

// --- Socket: volanie ---
socket.on('call:incoming', ({ callerId, callerName }) => {
  pendingCall = { callerId, callerName };
  callCallerName.textContent = callerName;
  callIncomingBar.style.display = '';
  addMessage({ system: true, text: `📲 Prichádzajúci hovor od ${callerName}`, timestamp: new Date().toISOString() });
});

// Volajúci: callee prijal → teraz vytvor offer a pošli ho
socket.on('call:accepted', async ({ calleeId, calleeName }) => {
  if (!callState || !callState.isInitiator) return;
  callState.peerId = calleeId;
  callState.peerName = calleeName;

  const localStream = await startLocalStream();
  if (!localStream) { endCall('Mikrofón nedostupný.'); return; }

  const pc = createPeerConnection(calleeId);
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
  callState.pc = pc;
  callState.localStream = localStream;

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit('call:offer', { peerId: calleeId, sdp: offer });

  callPeerName.textContent = calleeName;
  callActiveBar.style.display = '';
  callState.timerInterval = startCallTimer();
  addMessage({ system: true, text: `✅ Hovor spojený – ${calleeName}`, timestamp: new Date().toISOString() });
});

// Volaný: dostal offer → vytvor answer
socket.on('call:offer', async ({ fromId, sdp }) => {
  if (!callState || callState.isInitiator) return;

  const localStream = await startLocalStream();
  if (!localStream) { socket.emit('call:hangup', { peerId: fromId }); endCall('Mikrofón nedostupný.'); return; }

  const pc = createPeerConnection(fromId);
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
  callState.pc = pc;
  callState.localStream = localStream;

  await pc.setRemoteDescription(new RTCSessionDescription(sdp));

  // Aplikuj queued ICE candidates
  for (const c of pendingIceCandidates) {
    try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
  }
  pendingIceCandidates = [];

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('call:answer-sdp', { peerId: fromId, sdp: answer });

  callPeerName.textContent = callState.peerName;
  callActiveBar.style.display = '';
  callState.timerInterval = startCallTimer();
  addMessage({ system: true, text: `🔊 Hovor aktívny – ${callState.peerName}`, timestamp: new Date().toISOString() });
});

// Volajúci: dostal answer
socket.on('call:answer-sdp', async ({ sdp }) => {
  if (!callState || !callState.isInitiator || !callState.pc) return;
  await callState.pc.setRemoteDescription(new RTCSessionDescription(sdp));
  for (const c of pendingIceCandidates) {
    try { await callState.pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
  }
  pendingIceCandidates = [];
});

socket.on('call:ice', async ({ candidate }) => {
  if (!callState?.pc || !callState.pc.remoteDescription) {
    pendingIceCandidates.push(candidate);
    return;
  }
  try { await callState.pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {}
});

socket.on('call:rejected', ({ calleeName }) => {
  endCall(`${calleeName} odmietol/odmietla hovor.`);
});
socket.on('call:ended', ({ byName }) => {
  endCall(`${byName} ukončil/a hovor.`);
});
socket.on('call:error', (msg) => {
  addMessage({ system: true, text: `⚠ Hovor: ${msg}`, timestamp: new Date().toISOString() });
});
const createRoomInput = document.getElementById('create-room');
const createRoomBtn = document.getElementById('create-room-btn');
const roomsList = document.querySelector('.rooms-list');
const emojiLine = document.getElementById('emoji-line');
const emojiSet = ['🙂', '😃', '😍', '😎', '😏', '😡', '😂', '🙃', '😮'];
const reactionSet = ['👍', '❤️', '😂', '😮', '😡'];
const savedUsername = localStorage.getItem('chatUsername');
let currentUsername = savedUsername ? savedUsername.trim() : 'Správca';
let autoPrivateEnabled = localStorage.getItem('autoPrivateEnabled') === 'true';
let autoPrivateTargetName = localStorage.getItem('autoPrivateTargetName') || '';
let privateTargetId = null;
let privateTargetName = null;
let activeUsers = [];
const ignoreList = new Set(JSON.parse(localStorage.getItem('chatIgnoreList') || '[]'));
const friendList = new Set(JSON.parse(localStorage.getItem('chatFriendList') || '[]'));
const onlineFriends = new Set();
let audioCtx = null;
let messengerMode = localStorage.getItem('chatMessengerMode') === 'true';
let lastSpokenAt = Date.now();

const CHAT_INACTIVITY_MS = 60 * 60 * 1000;
const MESSENGER_INACTIVITY_MS = 60 * 60 * 1000;

function loadChatStats() {
  try {
    const raw = localStorage.getItem('chatStatsV1');
    if (!raw) return { users: {}, popularity: {}, edges: {} };
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users || {},
      popularity: parsed.popularity || {},
      edges: parsed.edges || {}
    };
  } catch (_) {
    return { users: {}, popularity: {}, edges: {} };
  }
}

function saveChatStats(stats) {
  localStorage.setItem('chatStatsV1', JSON.stringify(stats));
}

function updateActivityStats(username, delta) {
  const key = normalizeName(username);
  if (!key) return;
  const stats = loadChatStats();
  if (!stats.users[key]) {
    stats.users[key] = { displayName: username, messages: 0, voiceNotes: 0, lastActive: 0 };
  }
  const user = stats.users[key];
  user.displayName = username;
  user.messages += Number(delta.messages || 0);
  user.voiceNotes += Number(delta.voiceNotes || 0);
  user.lastActive = Date.now();
  saveChatStats(stats);
}

function updatePopularity(targetUsername, isAdded) {
  const actor = normalizeName(currentUsername);
  const target = normalizeName(targetUsername);
  if (!actor || !target || actor === target) return;

  const stats = loadChatStats();
  const edgeKey = `${actor}->${target}`;
  const edgeExists = !!stats.edges[edgeKey];

  if (isAdded && !edgeExists) {
    stats.edges[edgeKey] = 1;
    stats.popularity[target] = Number(stats.popularity[target] || 0) + 1;
  }

  if (!isAdded && edgeExists) {
    delete stats.edges[edgeKey];
    stats.popularity[target] = Math.max(0, Number(stats.popularity[target] || 0) - 1);
  }

  if (!stats.users[target]) {
    stats.users[target] = { displayName: targetUsername, messages: 0, voiceNotes: 0, lastActive: 0 };
  }
  stats.users[target].displayName = targetUsername;
  saveChatStats(stats);
}

function markSpokenActivity() {
  lastSpokenAt = Date.now();
}

function currentInactivityLimit() {
  return messengerMode ? MESSENGER_INACTIVITY_MS : CHAT_INACTIVITY_MS;
}

function performAutoLogout(reason) {
  alert(reason);
  localStorage.removeItem('chatUsername');
  localStorage.removeItem('chatRegistered');
  window.location.href = '/';
}

function checkInactivityLogout() {
  if (!localStorage.getItem('chatUsername')) return;
  const inactiveMs = Date.now() - lastSpokenAt;
  if (inactiveMs >= currentInactivityLimit()) {
    performAutoLogout(messengerMode
      ? 'Bol si 60 min neaktívny v Messengeri. Bol si automaticky odhlásený.'
      : 'Bol si 60 min neaktívny v chate. Bol si automaticky odhlásený.');
  }
}

function applyMessengerMode() {
  if (!chatApp || !navMessenger) return;
  chatApp.classList.toggle('messenger-mode', messengerMode);
  navMessenger.textContent = messengerMode ? 'Messenger ON' : 'Messenger';
  navMessenger.style.background = messengerMode ? '#2563eb' : '';
}

function playNotificationTone() {
  try {
    const AudioContextRef = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextRef) return;
    if (!audioCtx) audioCtx = new AudioContextRef();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.24);
  } catch (_) {
    // Ignore notification sound errors silently.
  }
}

function speakNotificationLine() {
  try {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance('Oddych chat, nova sprava, pozrite si.');
    utterance.lang = 'sk-SK';
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch (_) {
    // Ignore speech errors silently.
  }
}

function speakOfflineReminderLine() {
  try {
    playNotificationTone();
    setTimeout(() => {
      if (!('speechSynthesis' in window)) return;
      const utterance = new SpeechSynthesisUtterance('Pod si pozriet spravu, ty parena babka!');
      utterance.lang = 'sk-SK';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }, 260);
  } catch (_) {
    // Ignore offline reminder speech errors silently.
  }
}

function isAwayFromChat() {
  const hidden = document.visibilityState !== 'visible';
  const notFocused = typeof document.hasFocus === 'function' ? !document.hasFocus() : false;
  return hidden || notFocused;
}

function speakCountdownValue(value) {
  try {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(String(value));
    utterance.lang = 'sk-SK';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch (_) {
    // Ignore countdown speech errors silently.
  }
}

function openNewsHistory() {
  if (!newsHistoryPanel || !newsHistoryBackdrop) return;
  newsHistoryPanel.classList.add('open');
  newsHistoryBackdrop.classList.add('open');
  newsHistoryPanel.setAttribute('aria-hidden', 'false');
  newsHistoryBackdrop.setAttribute('aria-hidden', 'false');
}

function closeNewsHistory() {
  if (!newsHistoryPanel || !newsHistoryBackdrop) return;
  newsHistoryPanel.classList.remove('open');
  newsHistoryBackdrop.classList.remove('open');
  newsHistoryPanel.setAttribute('aria-hidden', 'true');
  newsHistoryBackdrop.setAttribute('aria-hidden', 'true');
}

async function enterCountdownFullscreen() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch (_) {
    // Fullscreen can fail in some browsers; keep the overlay visible anyway.
  }
}

async function exitCountdownFullscreen() {
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch (_) {
    // Ignore fullscreen exit errors.
  }
}

function renderCountdownOverlay(value, total, headlineText) {
  if (!countdownOverlay || !countdownValueEl || !countdownLabelEl) return;
  countdownValueEl.textContent = String(value);
  countdownLabelEl.textContent = headlineText || (total ? `Odpočítavam od ${total}` : 'Odpočítavanie');
  countdownOverlay.classList.add('visible');
  document.body.classList.add('countdown-active');
}

function hideCountdownOverlay() {
  if (countdownOverlay) {
    countdownOverlay.classList.remove('visible');
  }
  document.body.classList.remove('countdown-active');
}

function stopCountdown() {
  if (!countdownState) {
    hideCountdownOverlay();
    return;
  }
  if (countdownState.timer) {
    clearInterval(countdownState.timer);
  }
  if (countdownState.finishTimeout) {
    clearTimeout(countdownState.finishTimeout);
  }
  countdownState = null;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  hideCountdownOverlay();
  exitCountdownFullscreen();
}

function startCountdown(rawValue, options = {}) {
  const total = Math.floor(Number(rawValue));
  if (!Number.isFinite(total) || total < 1) {
    showToast('Použi .countdown číslo väčšie ako 0, napríklad .countdown 10');
    return;
  }
  if (total > 9999) {
    showToast('Skús číslo od 1 do 9999.');
    return;
  }

  stopCountdown();
  countdownState = {
    total,
    current: total,
    timer: null,
    finishTimeout: null,
    headline: options.headline || `Odpočítavam od ${total}`
  };

  renderCountdownOverlay(total, total, countdownState.headline);
  speakCountdownValue(total);
  enterCountdownFullscreen();

  countdownState.timer = setInterval(() => {
    if (!countdownState) return;
    countdownState.current -= 1;

    if (countdownState.current <= 0) {
      if (countdownState.timer) {
        clearInterval(countdownState.timer);
        countdownState.timer = null;
      }
      if (countdownValueEl) countdownValueEl.textContent = 'Štart!';
      if (countdownLabelEl) countdownLabelEl.textContent = countdownState.headline;
      speakCountdownValue('Štart');
      countdownState.finishTimeout = setTimeout(() => {
        stopCountdown();
      }, 1000);
      return;
    }

    renderCountdownOverlay(countdownState.current, countdownState.total, countdownState.headline);
    speakCountdownValue(countdownState.current);
  }, 1000);
}

function notifyIncomingMessage(fromName, previewText) {
  playNotificationTone();
  speakNotificationLine();

  if (!('Notification' in window)) return;
  const title = 'Oddych chat';
  const body = fromName ? `${fromName}: ${previewText || 'nova sprava'}` : (previewText || 'Nova sprava');

  if (Notification.permission === 'granted') {
    new Notification(title, { body });
    return;
  }
  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        new Notification(title, { body });
      }
    }).catch(() => {});
  }
}

// Global error handlers to surface runtime errors (helps debug why buttons stop working)
window.addEventListener('error', (e) => {
  try {
    alert(`Script error: ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`);
  } catch (err) {
    console.error('Error handler failed', err);
  }
});
window.addEventListener('unhandledrejection', (e) => {
  try {
    alert(`Unhandled promise rejection: ${e.reason}`);
  } catch (err) {
    console.error('Rejection handler failed', err);
  }
});

function saveIgnoreList() {
  localStorage.setItem('chatIgnoreList', JSON.stringify(Array.from(ignoreList)));
}

function saveFriendList() {
  localStorage.setItem('chatFriendList', JSON.stringify(Array.from(friendList)));
}

function normalizeName(value) {
  return (value || '').toString().trim().toLowerCase();
}

function isFriend(username) {
  return friendList.has(normalizeName(username));
}

function toggleFriend(username) {
  const key = normalizeName(username);
  if (!key) return false;
  if (friendList.has(key)) {
    friendList.delete(key);
    updatePopularity(username, false);
    saveFriendList();
    return false;
  }
  friendList.add(key);
  updatePopularity(username, true);
  saveFriendList();
  return true;
}

function toggleIgnoreUser(username) {
  if (!username) return;
  const lower = username.toLowerCase();
  if (ignoreList.has(lower)) {
    ignoreList.delete(lower);
    saveIgnoreList();
    showToast(`Už neignoruješ ${username}.`);
    return;
  }
  ignoreList.add(lower);
  saveIgnoreList();
  showToast(`Ignoruješ ${username}.`);
}

function removeIgnoredUser(username) {
  if (!username) return false;
  const lower = username.toLowerCase();
  if (!ignoreList.has(lower)) {
    return false;
  }
  ignoreList.delete(lower);
  saveIgnoreList();
  return true;
}

function isIgnored(username) {
  return ignoreList.has(username.toLowerCase());
}

function escapeHtml(s) {
  return (s || '').toString().replace(/[&<>\"]/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[c]));
}

function normalizeRoomName(value) {
  return (value || '').toString().trim().replace(/\s+/g, ' ').slice(0, 40) || 'Spoločná';
}

function displayChatName(name) {
  return kozaModeEnabled ? 'kozla' : name;
}

function saveRoomList() {
  if (!roomsList) return;
  const roomNames = Array.from(roomsList.querySelectorAll('.room-item'))
    .map((roomEl) => normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', '')))
    .filter((name) => name && name !== 'Spoločná');
  localStorage.setItem('chatRoomNamesV1', JSON.stringify(Array.from(new Set(roomNames))));
}

function updateRoomHighlight() {
  if (!roomsList) return;
  roomsList.querySelectorAll('.room-item').forEach((roomEl) => {
    const roomName = normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', ''));
    roomEl.classList.toggle('active', roomName === currentRoom);
  });
}

function renderVisibleMessages() {
  messagesDiv.innerHTML = '';
  publicMessageHistory.forEach((message) => {
    addMessage(message);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function storePublicMessage(message) {
  if (!message || message.system || message.private) return;
  const incomingId = message.id != null ? String(message.id) : null;
  if (!incomingId) {
    publicMessageHistory.push(message);
    return;
  }
  const existingIndex = publicMessageHistory.findIndex((item) => String(item.id) === incomingId);
  if (existingIndex >= 0) {
    publicMessageHistory[existingIndex] = message;
    return;
  }
  publicMessageHistory.push(message);
}

function setActiveRoom(roomName, options = {}) {
  const nextRoom = normalizeRoomName(roomName);
  currentRoom = nextRoom;
  localStorage.setItem('chatCurrentRoom', currentRoom);
  updateRoomHighlight();
  renderVisibleMessages();
  if (!options.silent) {
    showToast(`Vstúpil si do miestnosti ${currentRoom}.`);
  }
}

function addMessage(m) {
  if (!m.system) {
    try {
      const msgTime = new Date(m.timestamp || Date.now()).getTime();
      if (lastClearTime && msgTime <= lastClearTime) {
        return;
      }
    } catch (e) {
      // if timestamp parsing fails, don't block the message
    }
  }
  if (m.system) {
    const d = document.createElement('div');
    d.className = 'system-msg';
    d.textContent = m.text;
    messagesDiv.appendChild(d);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return;
  }

  if (m.username && isIgnored(m.username) && !m.private) {
    return;
  }

  if (!m.private) {
    const messageRoom = normalizeRoomName(m.room || 'Spoločná');
    if (messageRoom !== currentRoom) {
      return;
    }
  }

  const d = document.createElement('div');
  d.className = 'msg' + (m.username === currentUsername ? ' me' : '') + (m.private ? ' private' : '');
  const bubble = document.createElement('div');
  bubble.className = 'bubble' + (m.private ? ' private' : '');
  const privateLabel = m.private
    ? `<div class="private-label">${m.self ? `Súkromné → ${escapeHtml(m.toUsername || '')}` : 'Súkromné'}</div>`
    : '';
  bubble.innerHTML = `
    <div class="from"><strong>${escapeHtml(displayChatName(m.username))}</strong></div>
    ${privateLabel}
    <div class="text">${escapeHtml(m.text)}</div>
    <div class="meta">${new Date(m.timestamp || Date.now()).toLocaleString()}</div>
  `;

  if (!m.private) {
    const reactionRow = buildReactionRow(m.id, m.reactions || {});
    bubble.appendChild(reactionRow);
  }

  d.appendChild(bubble);
  if (m.id) {
    d.dataset.messageId = String(m.id);
  }
  messagesDiv.appendChild(d);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function buildReactionRow(messageId, reactions) {
  const row = document.createElement('div');
  row.className = 'reaction-row';
  row.dataset.messageId = String(messageId);

  reactionSet.forEach((emoji) => {
    const usersForEmoji = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];
    const count = usersForEmoji.length;
    const active = usersForEmoji.includes(currentUsername);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `reaction-btn${active ? ' active' : ''}`;
    button.dataset.emoji = emoji;
    button.dataset.messageId = String(messageId);
    button.textContent = count > 0 ? `${emoji} ${count}` : emoji;
    row.appendChild(button);
  });

  return row;
}

function updateReactionRow(messageId, reactions) {
  const container = messagesDiv.querySelector(`.msg[data-message-id="${messageId}"] .reaction-row`);
  if (!container) return;

  const newRow = buildReactionRow(messageId, reactions || {});
  container.replaceWith(newRow);
}

function updateUserList(users) {
  if (activeUsersCount) {
    activeUsersCount.textContent = users.length;
  }
  if (currentUsernameDisplay) {
    currentUsernameDisplay.textContent = displayChatName(currentUsername);
  }
  if (!usersList) return;
  usersList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    const name = user.username;
    const shownName = displayChatName(name);
    const nameSpan = document.createElement('span');
    nameSpan.textContent = user.role === 'admin'
      ? `${shownName} [admin]`
      : (user.role === 'tester' ? `${shownName} [tester]` : shownName);
    li.appendChild(nameSpan);

    if (user.username === currentUsername) {
      li.style.fontWeight = '700';
      li.style.opacity = '0.7';
      li.style.cursor = 'default';
    } else {
      const friendBtn = document.createElement('button');
      friendBtn.type = 'button';
      friendBtn.className = `friend-envelope${isFriend(name) ? ' active' : ''}`;
      friendBtn.title = isFriend(name) ? 'Odobrať z priateľov' : 'Pridať do priateľov';
      friendBtn.textContent = '✉';
      friendBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const added = toggleFriend(name);
        friendBtn.classList.toggle('active', added);
        friendBtn.title = added ? 'Odobrať z priateľov' : 'Pridať do priateľov';
        addMessage({
          system: true,
          text: added
            ? `✉ Pridal si ${name} medzi priateľov.`
            : `✉ Odobral si ${name} z priateľov.`,
          timestamp: new Date().toISOString()
        });
      });

      li.appendChild(friendBtn);

      const callBtn = document.createElement('button');
      callBtn.type = 'button';
      callBtn.className = 'call-btn';
      callBtn.textContent = '📞';
      callBtn.title = `Zavolať ${name}`;
      callBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        initiateCall(user.id, user.username);
      });
      li.appendChild(callBtn);

      li.dataset.id = user.id;
      li.dataset.name = user.username;
      li.addEventListener('click', () => {
        messageInput.value = `@${user.username} `;
        messageInput.focus();
        showToast(`Adresuješ: ${user.username}`);
      });
      li.addEventListener('dblclick', () => {
        setPrivateTarget(user.id, user.username);
      });
    }
    usersList.appendChild(li);
  });

  // Aktualizuj call zoznam
  const callUsersList = document.getElementById('call-users-list');
  const callHint = document.getElementById('call-hint');
  if (callUsersList) {
    const others = users.filter(u => u.username !== currentUsername);
    callUsersList.innerHTML = '';
    if (others.length === 0) {
      if (callHint) callHint.style.display = '';
    } else {
      if (callHint) callHint.style.display = 'none';
      others.forEach(u => {
        const li = document.createElement('li');
        li.className = 'call-user-item';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = u.username;
        const btn = document.createElement('button');
        btn.className = 'call-user-call-btn';
        btn.textContent = '📞 Zavolať';
        btn.addEventListener('click', () => initiateCall(u.id, u.username));
        li.appendChild(nameSpan);
        li.appendChild(btn);
        callUsersList.appendChild(li);
      });
    }
  }
}

function notifyFriendOnlineStatus(users) {
  const currentlyOnlineFriends = new Set();

  users.forEach((user) => {
    if (user.username === currentUsername) return;
    if (isFriend(user.username)) {
      const key = normalizeName(user.username);
      currentlyOnlineFriends.add(key);
      if (!onlineFriends.has(key)) {
        const now = new Date();
        addMessage({
          system: true,
          text: `✉ Tvoj priateľ ${user.username} je na chate. ${now.toLocaleString()} | Tvoj oddych chat`,
          timestamp: now.toISOString()
        });
      }
    }
  });

  onlineFriends.clear();
  currentlyOnlineFriends.forEach((key) => onlineFriends.add(key));
}

function setPrivateTarget(id, username) {
  privateTargetId = id;
  privateTargetName = username;
  if (privateStatus && privateTargetNameDisplay) {
    privateTargetNameDisplay.textContent = privateTargetName;
    privateStatus.style.display = 'block';
  }
  showToast(`Odkazovač aktivovaný: súkromná správa pre ${privateTargetName}`);
  messageInput.focus();
}

function clearPrivateTarget() {
  privateTargetId = null;
  privateTargetName = null;
  refreshPrivateStatus();
}

function refreshPrivateStatus() {
  if (!privateStatus || !privateTargetNameDisplay) return;
  if (privateTargetName) {
    privateTargetNameDisplay.textContent = privateTargetName;
    privateStatus.style.display = 'block';
    return;
  }
  if (autoPrivateEnabled && autoPrivateTargetName) {
    privateTargetNameDisplay.textContent = `${autoPrivateTargetName} (AUTO)`;
    privateStatus.style.display = 'block';
    return;
  }
  privateStatus.style.display = 'none';
}

function openSendSettings() {
  if (!sendSettingsModal || !sendSettingsTarget || !sendSettingsPrivateToggle) return;
  sendSettingsTarget.innerHTML = '';
  const others = activeUsers.filter((u) => u.username !== currentUsername);
  if (!others.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Nikto iný nie je online';
    sendSettingsTarget.appendChild(opt);
    sendSettingsTarget.disabled = true;
  } else {
    sendSettingsTarget.disabled = false;
    others.forEach((u) => {
      const opt = document.createElement('option');
      opt.value = u.username;
      opt.textContent = u.username;
      sendSettingsTarget.appendChild(opt);
    });
    const exists = others.some((u) => u.username.toLowerCase() === autoPrivateTargetName.toLowerCase());
    sendSettingsTarget.value = exists ? autoPrivateTargetName : others[0].username;
  }
  sendSettingsPrivateToggle.checked = autoPrivateEnabled;
  sendSettingsModal.style.display = 'flex';
}

function saveSendSettings() {
  if (!sendSettingsPrivateToggle || !sendSettingsTarget) return;
  autoPrivateEnabled = !!sendSettingsPrivateToggle.checked;
  autoPrivateTargetName = sendSettingsTarget.value || '';
  localStorage.setItem('autoPrivateEnabled', autoPrivateEnabled ? 'true' : 'false');
  localStorage.setItem('autoPrivateTargetName', autoPrivateTargetName);
  refreshPrivateStatus();
  showToast(autoPrivateEnabled && autoPrivateTargetName
    ? `Súkromné odosielanie je zapnuté pre ${autoPrivateTargetName}.`
    : 'Súkromné odosielanie je vypnuté.');
  if (sendSettingsModal) sendSettingsModal.style.display = 'none';
}

function canCreateRoom() {
  const storedUser = localStorage.getItem('chatUsername')?.trim();
  const registered = localStorage.getItem('chatRegistered') === 'true';
  const isAdmin = ['admin', 'administrator', 'spravca', 'správca'].includes((storedUser || '').toLowerCase());
  return registered || isAdmin;
}

function canManageRooms() {
  const storedUser = localStorage.getItem('chatUsername')?.trim();
  const normalized = (storedUser || currentUsername || '').toLowerCase();
  return ['admin', 'administrator', 'spravca', 'správca'].includes(normalized);
}

function updateCreateRoomControl() {
  const allowed = canCreateRoom();
  if (createRoomInput) {
    createRoomInput.disabled = !allowed;
    createRoomInput.placeholder = allowed
      ? 'Napíš názov novej miestnosti...' 
      : 'Iba registrovaný a admin môže vytvoriť';
  }
  if (createRoomBtn) {
    createRoomBtn.disabled = !allowed;
  }
}

function addRoomToList(name, options = {}) {
  if (!roomsList || !name) return;
  const roomName = normalizeRoomName(name);
  const existing = Array.from(roomsList.querySelectorAll('.room-item')).find(
    (roomEl) => normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', '')) === roomName
  );
  if (existing) {
    existing.dataset.roomName = roomName;
    return existing;
  }
  const roomItem = document.createElement('div');
  roomItem.className = 'room-item';
  roomItem.dataset.roomName = roomName;
  roomItem.textContent = `${roomName} (0)`;
  const del = document.createElement('button');
  del.className = 'room-delete';
  del.setAttribute('title', 'Zmazať miestnosť');
  del.textContent = '✕';
  roomItem.appendChild(del);
  roomsList.appendChild(roomItem);
  if (options.activate) {
    setActiveRoom(roomName, { silent: true });
  } else {
    updateRoomHighlight();
  }
  if (options.persist !== false) {
    saveRoomList();
  }
  return roomItem;
}

// Handle delete clicks (delegation)
roomsList?.addEventListener('click', (e) => {
  const btn = e.target.closest('.room-delete');
  const roomEl = e.target.closest('.room-item');
  if (!roomEl) return;
  if (btn) {
    const isPermanent = roomEl.getAttribute('data-permanent') === 'true';
    if (isPermanent) {
      showToast('Neblbni, stálu miestnosť nie je možné zrušiť');
      return;
    }
    const removedRoom = normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', ''));
    roomEl.remove();
    saveRoomList();
    if (removedRoom === currentRoom) {
      setActiveRoom('Spoločná', { silent: true });
    }
    showToast('Miestnosť zmazaná.');
    return;
  }

  const selectedRoom = normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', ''));
  if (selectedRoom) {
    setActiveRoom(selectedRoom);
  }
});

function insertEmoji(emoji) {
  if (!messageInput) return;
  const start = messageInput.selectionStart ?? messageInput.value.length;
  const end = messageInput.selectionEnd ?? messageInput.value.length;
  const value = messageInput.value;
  messageInput.value = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
  const pos = start + emoji.length;
  messageInput.focus();
  messageInput.setSelectionRange(pos, pos);
}

function initEmojiLine() {
  if (!emojiLine) return;
  emojiLine.innerHTML = '';
  emojiSet.forEach((emoji) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'emoji-btn';
    btn.textContent = emoji;
    btn.addEventListener('click', () => insertEmoji(emoji));
    emojiLine.appendChild(btn);
  });
}

function sendJoin() {
  currentUsername = localStorage.getItem('chatUsername')?.trim() || 'Správca';
  if (!currentUsername) currentUsername = 'Správca';
  if (currentUsernameDisplay) {
    currentUsernameDisplay.textContent = displayChatName(currentUsername);
  }
  updateCreateRoomControl();
  socket.emit('join', { username: currentUsername, room: currentRoom });
}

socket.on('connect', () => {
  initEmojiLine();
  const savedRooms = JSON.parse(localStorage.getItem('chatRoomNamesV1') || '[]');
  savedRooms.forEach((roomName) => addRoomToList(roomName, { persist: false }));
  if (currentRoom !== 'Spoločná' && !Array.from(roomsList?.querySelectorAll('.room-item') || []).some((roomEl) => normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', '')) === currentRoom)) {
    addRoomToList(currentRoom, { persist: false });
  }
  updateRoomHighlight();
  sendJoin();
  applyMessengerMode();
  lastSpokenAt = Date.now();
});

setInterval(checkInactivityLogout, 60 * 1000);

socket.on('load-messages', (msgs) => {
  publicMessageHistory = Array.isArray(msgs) ? msgs.filter((msg) => !msg.private && !msg.system) : [];
  renderVisibleMessages();
});

socket.on('receive-message', (m) => {
  storePublicMessage(m);
  const visibleRoom = normalizeRoomName(m && m.room ? m.room : 'Spoločná');
  const isVisible = !m || m.private || m.system || visibleRoom === currentRoom;
  if (isVisible) {
    addMessage(m);
  }
  if (isVisible && m && m.username && m.username !== currentUsername) {
    speakOfflineReminderLine();
  }
});

socket.on('system-message', (msg) => {
  addMessage({ system: true, text: msg, timestamp: new Date().toISOString() });
});

socket.on('join-denied', (message) => {
  addMessage({ system: true, text: `⚠ ${message || 'Toto meno je už obsadené. Zvoľ si iné.'}`, timestamp: new Date().toISOString() });
});

socket.on('user-list', (users) => {
  activeUsers = users;
  updateUserList(users);
  notifyFriendOnlineStatus(users);
  refreshPrivateStatus();
});

socket.on('message-reaction-updated', ({ messageId, reactions }) => {
  updateReactionRow(messageId, reactions);
});

socket.on('koza:mode', ({ enabled, byUsername }) => {
  kozaModeEnabled = !!enabled;
  renderVisibleMessages();
  updateUserList(activeUsers);
  if (enabled && byUsername) {
    addMessage({
      system: true,
      text: `${byUsername} spustil/a príkaz .koza. Všetci ste teraz kozla.`,
      timestamp: new Date().toISOString()
    });
  }
});

socket.on('countdown:start', ({ value, byUsername }) => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return;
  const who = (byUsername || 'Správca').toString();
  startCountdown(n, { headline: `${who} dal príkaz .countdown ${n}` });
});

function sendMessage() {
  let text = messageInput.value.trim();
  if (!text) return;

  if (text.startsWith('.zmaz')) {
    lastClearTime = Date.now();
    localStorage.setItem('chatClearAt', String(lastClearTime));
    renderVisibleMessages();
    showToast('Okno vymazané.');
    messageInput.value = '';
    return;
  }

  if (text.toLowerCase() === '.koza') {
    socket.emit('koza:enable');
    messageInput.value = '';
    return;
  }

  const countdownMatch = text.match(/^\.countdown(?:\s+(.+))?$/i);
  if (countdownMatch) {
    const valueText = (countdownMatch[1] || '').trim();
    if (!valueText) {
      showToast('Použi .countdown číslo, napríklad .countdown 10');
      messageInput.value = '';
      return;
    }
    if (!canManageRooms()) {
      showToast('Príkaz .countdown môže spustiť iba Správca/admin.');
      messageInput.value = '';
      return;
    }
    socket.emit('countdown:start', { value: valueText });
    messageInput.value = '';
    return;
  }

  if (text.startsWith('.ignoruj')) {
    const parts = text.split(' ');
    const target = parts.slice(1).join(' ').trim();
    if (!target) {
      showToast('Použi .ignoruj meno');
      return;
    }
    const wasAdded = !ignoreList.has(normalizeName(target));
    toggleIgnoreUser(target);
    if (wasAdded) {
      socket.emit('notify-ignored', { targetName: target, byName: currentUsername });
    }
    messageInput.value = '';
    return;
  }

  if (text.startsWith('.neignoruj')) {
    const parts = text.split(' ');
    const target = parts.slice(1).join(' ').trim();
    if (!target) {
      showToast('Použi .neignoruj meno');
      return;
    }
    const removed = removeIgnoredUser(target);
    if (removed) {
      showToast(`Už neignoruješ ${target}.`);
    } else {
      showToast(`Používateľ ${target} nie je v ignorovaných.`);
    }
    messageInput.value = '';
    return;
  }

  if (text.startsWith('.vyhodip')) {
    const parts = text.split(' ');
    const target = parts.slice(1).join(' ').trim();
    if (!target) {
      showToast('Použi .vyhodip meno');
      return;
    }
    if (target.toLowerCase() === currentUsername.toLowerCase()) {
      showToast('Seba nevyhodíš.');
      return;
    }
    socket.emit('command', { type: 'kick', target, from: currentUsername });
    messageInput.value = '';
    return;
  }

  if (text.startsWith('.zrusitmiestnost')) {
    if (!canManageRooms()) {
      addMessage({
        system: true,
        text: 'Neblbni, stálu miestnosť nie je možné zrušiť',
        timestamp: new Date().toISOString()
      });
      messageInput.value = '';
      return;
    }

    addMessage({
      system: true,
      text: 'Príkaz pre správcu je prijatý, zrušenie miestnosti ešte nie je implementované.',
      timestamp: new Date().toISOString()
    });
    messageInput.value = '';
    return;
  }

  if (privateTargetId) {
    markSpokenActivity();
    updateActivityStats(currentUsername, { messages: 1 });
    socket.emit('send-private-message', {
      to: privateTargetId,
      text
    });
    messageInput.value = '';
    clearPrivateTarget();
    return;
  }

  if (autoPrivateEnabled && autoPrivateTargetName) {
    const targetUser = activeUsers.find((u) => u.username.toLowerCase() === autoPrivateTargetName.toLowerCase());
    if (!targetUser) {
      showToast(`Používateľ ${autoPrivateTargetName} nie je online. Správa nebola odoslaná.`);
      return;
    }
    markSpokenActivity();
    updateActivityStats(currentUsername, { messages: 1 });
    socket.emit('send-private-message', {
      to: targetUser.id,
      text
    });
    messageInput.value = '';
    return;
  }

  markSpokenActivity();
  updateActivityStats(currentUsername, { messages: 1 });
  socket.emit('send-message', {
    username: currentUsername,
    text,
    timestamp: new Date().toISOString(),
    room: currentRoom
  });
  messageInput.value = '';
}

socket.on('receive-private-message', (m) => {
  addMessage({
    username: m.self ? currentUsername : m.from,
    text: m.text,
    timestamp: m.timestamp,
    private: true,
    self: m.self,
    toUsername: m.toUsername
  });
  if (!m.self) {
    speakOfflineReminderLine();
  }
});

function showToast(message) {
  addMessage({
    system: true,
    text: message,
    timestamp: new Date().toISOString()
  });
}

navLogout?.addEventListener('click', (event) => {
  event.preventDefault();
  localStorage.removeItem('chatUsername');
  window.location.href = '/';
});
navHelp?.addEventListener('click', (event) => {
  event.preventDefault();
  showToast('Návod: Enter odosiela správu, Shift+Enter pridá nový riadok, .zmaz vymaže okno len u teba, .countdown 10 spustí hlasný odpočet, .koza premenuje mená všetkých na kozla, klik na meno adresuje, dvojklik pošle šepkanie a klik na miestnosť ju otvorí.');
});
navProfile?.addEventListener('click', (event) => {
  event.preventDefault();
  showToast(`Prihlásený ako: ${currentUsername}`);
});
navFriends?.addEventListener('click', (event) => {
  event.preventDefault();
  usersList?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
navIgnore?.addEventListener('click', (event) => {
  event.preventDefault();
  showToast('Ignorovaní budú dostupní čoskoro.');
});
navSettings?.addEventListener('click', (event) => {
  event.preventDefault();
  openSendSettings();
});
navQuicklink?.addEventListener('click', (event) => {
  event.preventDefault();
  const otherUser = activeUsers.find((user) => user.username !== currentUsername);
  if (otherUser) {
    setPrivateTarget(otherUser.id, otherUser.username);
    return;
  }
  showToast('Zatiaľ žiadny iný chater pre odkazovač.');
});
newsHistoryToggle?.addEventListener('click', (event) => {
  event.preventDefault();
  openNewsHistory();
});
newsHistoryClose?.addEventListener('click', () => {
  closeNewsHistory();
});
newsHistoryBackdrop?.addEventListener('click', () => {
  closeNewsHistory();
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeNewsHistory();
  }
});
navMessenger?.addEventListener('click', (event) => {
  event.preventDefault();
  window.location.href = '/messenger.html';
});

document.getElementById('nav-call-open')?.addEventListener('click', (event) => {
  event.preventDefault();
  const modal = document.getElementById('call-modal');
  const list = document.getElementById('call-modal-list');
  if (!modal || !list) return;
  const others = activeUsers.filter(u => u.username !== currentUsername);
  list.innerHTML = '';
  if (others.length === 0) {
    list.innerHTML = '<li style="color:#888;text-align:center;padding:10px;">Nikto iný nie je online.</li>';
  } else {
    others.forEach(u => {
      const li = document.createElement('li');
      li.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f9f9f9;border-radius:12px;border:1px solid #eee;';
      const name = document.createElement('span');
      name.style.cssText = 'font-weight:700;color:#3e2513;font-size:0.95rem;';
      name.textContent = u.username;
      const btn = document.createElement('button');
      btn.style.cssText = 'background:#3a7f2a;color:#fff;border:none;border-radius:10px;padding:8px 16px;font-weight:700;cursor:pointer;font-size:0.9rem;';
      btn.textContent = '📞 Zavolať';
      btn.addEventListener('click', () => {
        modal.style.display = 'none';
        initiateCall(u.id, u.username);
      });
      li.appendChild(name);
      li.appendChild(btn);
      list.appendChild(li);
    });
  }
  modal.style.display = 'flex';
});

document.getElementById('call-modal-close')?.addEventListener('click', () => {
  const modal = document.getElementById('call-modal');
  if (modal) modal.style.display = 'none';
});

sendSettingsSave?.addEventListener('click', saveSendSettings);
sendSettingsCancel?.addEventListener('click', () => {
  if (sendSettingsModal) sendSettingsModal.style.display = 'none';
});
createRoomBtn?.addEventListener('click', () => {
  if (!canCreateRoom()) {
    showToast('Na vytvorenie miestnosti musíš byť registrovaný alebo admin.');
    return;
  }
  const roomName = createRoomInput?.value.trim() || `Miestnosť ${Date.now()}`;
  if (!roomName || roomName === 'Miestnosť') {
    showToast('Zadaj názov miestnosti.');
    return;
  }
  const roomItem = addRoomToList(roomName, { activate: true });
  if (roomItem) {
    setActiveRoom(roomName, { silent: true });
  }
  if (createRoomInput) {
    createRoomInput.value = '';
  }
  showToast('Miestnosť vytvorená a otvorená.');
});

sendBtn?.addEventListener('click', sendMessage);
messageInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

messagesDiv?.addEventListener('click', (event) => {
  const button = event.target.closest('.reaction-btn');
  if (!button) return;

  const messageId = Number(button.dataset.messageId);
  const emoji = button.dataset.emoji;
  if (!messageId || !emoji) return;

  socket.emit('toggle-reaction', { messageId, emoji });
});
