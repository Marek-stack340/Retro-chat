// RETRO CHAT CLIENT - JavaScript

// Initialize Socket.io
const socket = io();

// DOM Elements
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const joinModal = document.getElementById('join-modal');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');
const typingUser = document.getElementById('typing-user');
const usersList = document.getElementById('users-list');
const usernameDisplay = document.getElementById('username-display');
const userCount = document.getElementById('user-count');
const chatContainer = document.getElementById('chat-container');
const inputArea = document.getElementById('input-area');
const openRegisterBtn = document.getElementById('open-register-btn');
const registerModal = document.getElementById('register-modal');
const registerBtn = document.getElementById('register-btn');
const registerUsername = document.getElementById('register-username');
const registerEmail = document.getElementById('register-email');
const registerPassword = document.getElementById('register-password');
const closeRegisterBtn = document.getElementById('close-register-btn');
const registerStatus = document.getElementById('register-status');
const openOdkazovacBtn = document.getElementById('open-odkazovac-btn');
const odkazovacDot = document.getElementById('odkazovac-dot');

let currentUsername = '';
let typingTimeout = null;
let odkazovacModal = document.getElementById('odkazovac-modal');
let odkazovacTitle = document.getElementById('odkazovac-title');
let odkazovacRecipient = document.getElementById('odkazovac-recipient');
let odkazovacWarning = document.getElementById('odkazovac-warning');
let odkazovacUserList = document.getElementById('odkazovac-user-list');
let odkazovacMessages = document.getElementById('odkazovac-messages');
let odkazovacInput = document.getElementById('odkazovac-input');
let odkazovacSend = document.getElementById('odkazovac-send');
let odkazovacClose = document.getElementById('odkazovac-close');
let currentOdkazovac = null; // { id, username }
const odkazovacHistory = new Map();

// Call (WebRTC) elements and state
let callModal = document.getElementById('call-modal');
let callTitle = document.getElementById('call-title');
let remoteVideo = document.getElementById('remoteVideo');
let localVideo = document.getElementById('localVideo');
let callHangup = document.getElementById('call-hangup');
let callMute = document.getElementById('call-mute');
let pc = null;
let localStream = null;
let currentCall = null; // { id, username }
const pcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// Auto-scroll messages to bottom
function scrollToBottom() {
    const messagesWrapper = document.querySelector('.messages-wrapper');
    messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
}

// Format time for messages
function formatTime(date) {
    return new Date(date).toLocaleTimeString('sk-SK', { 
        hour: '2-digit', 
        minute: '2-digit'
    });
}

// Add system message
function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = `*** ${text} ***`;
    messagesDiv.appendChild(messageDiv);
    scrollToBottom();
}

// Add chat message
function addMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-username">${message.username}:</span>
            <span class="message-time">${formatTime(message.timestamp)}</span>
        </div>
        <div class="message-text">${escapeHtml(message.text)}</div>
    `;
    messagesDiv.appendChild(messageDiv);
    scrollToBottom();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Update users list
function updateUsersList(users) {
    usersList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.className = 'user-item';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = user.username;
        nameSpan.style.flex = '1';

        const callBtn = document.createElement('button');
        callBtn.className = 'retro-button';
        callBtn.style.padding = '6px 10px';
        callBtn.style.fontSize = '11px';
        // For AI bot show a call icon
        if (user.id === 'ai' || user.role === 'bot' || (user.username && user.username.toLowerCase().includes('ai'))) {
            callBtn.innerHTML = '<svg class="call-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 01.95-.27c1.05.28 2.18.43 3.34.43a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.16.15 2.29.43 3.34a1 1 0 01-.27.95l-2.04 2.5z"/></svg>';
            callBtn.title = `Zavolať ${user.username}`;
            callBtn.classList.add('call-ai');
        } else {
            callBtn.textContent = 'CALL';
            callBtn.title = `Zavolať ${user.username}`;
        }
        callBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openCall(user);
        });

        const chatBtn = document.createElement('button');
        chatBtn.className = 'retro-button';
        chatBtn.style.padding = '6px 10px';
        chatBtn.style.fontSize = '11px';
        chatBtn.textContent = 'NAPÍŠ';
        chatBtn.title = `Otvoriť odkazovač pre ${user.username}`;
        chatBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openOdkazovacWithUser(user);
        });

        li.appendChild(nameSpan);
        li.appendChild(chatBtn);
        li.appendChild(callBtn);
        usersList.appendChild(li);
    });
renderOdkazovacUsers(users);
    odkazovacUserList.innerHTML = '';
    users.forEach(user => {
        if (user.username === currentUsername) return;
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.padding = '8px 6px';
        li.style.borderBottom = '1px solid rgba(0,0,0,0.05)';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = user.username;
        nameSpan.style.flex = '1';
        nameSpan.style.fontWeight = '600';
        nameSpan.style.color = 'var(--text-color)';

        const selectBtn = document.createElement('button');
        selectBtn.className = 'retro-button';
        selectBtn.style.padding = '6px 10px';
        selectBtn.style.fontSize = '11px';
        selectBtn.textContent = 'NAPÍŠ';
        selectBtn.addEventListener('click', () => openOdkazovacWithUser(user));

        li.appendChild(nameSpan);
        li.appendChild(selectBtn);
        odkazovacUserList.appendChild(li);
    });
}

function openOdkazovacWithUser(user) {
    if (!user || !user.id) return;
    currentOdkazovac = { id: user.id, username: user.username };
    odkazovacTitle.textContent = `Odkazovač: ${user.username}`;
    odkazovacRecipient.textContent = `Príjemca: ${user.username}`;
    odkazovacModal.classList.remove('hidden');
    renderOdkazovacMessages();
    odkazovacInput.focus();
    clearOdkazovacAlert();
}

function openOdkazovac() {
    currentOdkazovac = null;
    odkazovacModal.classList.remove('hidden');
    odkazovacTitle.textContent = 'ODKAZOVAČ';
    odkazovacRecipient.textContent = 'Príjemca: (vyber používateľa)';
    renderOdkazovacMessages();
    odkazovacInput.focus();
    clearOdkazovacAlert();
}

function closeOdkazovac() {
    currentOdkazovac = null;
    odkazovacModal.classList.add('hidden');
    clearOdkazovacAlert();
}

function renderOdkazovacMessages() {
    odkazovacMessages.innerHTML = '';
    if (!currentOdkazovac) {
        odkazovacMessages.innerHTML = '<p style="color:rgba(0,0,0,0.5);font-size:13px;">Vyber používateľa v zozname na ľavej strane. Správu odošleš až po vybraní príjemcu.</p>';
        return;
    }
    const history = odkazovacHistory.get(currentOdkazovac.id) || [];
    history.forEach(m => {
        const d = document.createElement('div');
        d.style.marginBottom = '10px';
        d.innerHTML = `<strong>${escapeHtml(m.from)}:</strong> ${escapeHtml(m.text)} <div style="color:rgba(0,0,0,0.45);font-size:11px;margin-top:3px;">${formatTime(m.timestamp)}</div>`;
        odkazovacMessages.appendChild(d);
    });
    odkazovacMessages.scrollTop = odkazovacMessages.scrollHeight;
}

function setOdkazovacAlert() {
    if (odkazovacDot) odkazovacDot.classList.remove('hidden');
    if (openOdkazovacBtn) openOdkazovacBtn.classList.add('blink-red');
}

function clearOdkazovacAlert() {
    if (odkazovacDot) odkazovacDot.classList.add('hidden');
    if (openOdkazovacBtn) openOdkazovacBtn.classList.remove('blink-red');
    if (odkazovacWarning) odkazovacWarning.classList.add('hidden');
}

function showOdkazovacAlert(message) {
    if (odkazovacWarning) {
        odkazovacWarning.textContent = message;
        odkazovacWarning.classList.remove('hidden');
    }
}

function sendOdkazovacMessage() {
    if (!currentOdkazovac) {
        alert('Vyber používateľa pre odkazovač.');
        return;
    }
    const text = odkazovacInput.value.trim();
    if (!text) return;
    socket.emit('private-message', { to: currentOdkazovac.id, text });
    const entry = { from: currentUsername, text, timestamp: new Date().toISOString() };
    const history = odkazovacHistory.get(currentOdkazovac.id) || [];
    history.push(entry);
    odkazovacHistory.set(currentOdkazovac.id, history);
    odkazovacInput.value = '';
    renderOdkazovacMessages();
}

openOdkazovacBtn.addEventListener('click', () => {
    openOdkazovac();
});

odkazovacSend.addEventListener('click', sendOdkazovacMessage);
odkazovacClose.addEventListener('click', closeOdkazovac);
odkazovacInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendOdkazovacMessage(); });

// Call controls
callHangup.addEventListener('click', () => {
    endCall();
});
callMute.addEventListener('click', () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    callMute.textContent = audioTrack.enabled ? 'Mute' : 'Unmute';
});

async function openCall(user) {
    if (!user || !user.id) return;
    // If the target is the AI bot, open simulated AI call
    if (user.id === 'ai' || user.role === 'bot' || (typeof user.username === 'string' && user.username.toLowerCase().includes('ai'))) {
        openAICall(user);
        return;
    }

    currentCall = { id: user.id, username: user.username };
    callTitle.textContent = `Hovor s ${user.username}`;
    callModal.classList.remove('hidden');
    await startLocalStream();
    createPeerConnection();
    // create offer
    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { to: user.id, sdp: offer });
    } catch (err) {
        console.error('Offer error', err);
    }
}

// ------ AI Call (simulated) ------
function openAICall(user) {
    currentCall = { id: user.id, username: user.username };
    callTitle.textContent = `Hovor s ${user.username}`;
    callModal.classList.remove('hidden');
    // hide video elements (this is a simulated call)
    remoteVideo.style.display = 'none';
    localVideo.style.display = 'none';
    const aiArea = document.getElementById('ai-call-area');
    const aiMessages = document.getElementById('ai-call-messages');
    const aiInput = document.getElementById('ai-call-input');
    const aiSend = document.getElementById('ai-call-send');
    aiArea.classList.remove('hidden');
    aiMessages.innerHTML = '';

    // Start session on server
    socket.emit('start-ai-call', {});

    // send on button click
    const sendFn = () => {
        const text = aiInput.value.trim();
        if (!text) return;
        // display local
        const d = document.createElement('div');
        d.style.margin = '6px 0';
        d.innerHTML = `<strong>${currentUsername}:</strong> ${escapeHtml(text)}`;
        aiMessages.appendChild(d);
        aiMessages.scrollTop = aiMessages.scrollHeight;
        socket.emit('ai-call-send', { text });
        aiInput.value = '';
    };

    aiSend.addEventListener('click', sendFn);
    aiInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendFn(); });
}

function closeCallUI() {
    callModal.classList.add('hidden');
    remoteVideo.srcObject = null;
    localVideo.srcObject = null;
}

async function startLocalStream() {
    if (localStream) return localStream;
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        localVideo.srcObject = localStream;
        return localStream;
    } catch (err) {
        console.error('getUserMedia error', err);
        alert('Nie je možné získať prístup k mikrofónu/kamere');
        throw err;
    }
}

function createPeerConnection() {
    if (pc) return pc;
    pc = new RTCPeerConnection(pcConfig);

    // add local tracks
    if (localStream) {
        localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    }

    pc.ontrack = (evt) => {
        remoteVideo.srcObject = evt.streams[0];
    };

    pc.onicecandidate = (evt) => {
        if (evt.candidate) {
            socket.emit('webrtc-candidate', { to: currentCall ? currentCall.id : null, candidate: evt.candidate });
        }
    };

    pc.onconnectionstatechange = () => {
        if (!pc) return;
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
            endCall();
        }
    };

    return pc;
}

async function endCall() {
    try {
        if (pc) {
            try { pc.close(); } catch (e) {}
            pc = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            localStream = null;
        }
        socket.emit('webrtc-end', { to: currentCall ? currentCall.id : null });
    } catch (err) {
        console.error('endCall error', err);
    } finally {
        currentCall = null;
        // restore UI
        const aiArea = document.getElementById('ai-call-area');
        if (aiArea) {
            aiArea.classList.add('hidden');
        }
        remoteVideo.style.display = '';
        localVideo.style.display = '';
        closeCallUI();
    }
}

// Join chat
function joinChat() {
    const username = usernameInput.value.trim().toUpperCase();
    
    if (!username) {
        alert('>>> PLEASE ENTER A USERNAME <<<');
        return;
    }

    if (username.length > 20) {
        alert('>>> USERNAME TOO LONG (MAX 20 CHARACTERS) <<<');
        return;
    }

    currentUsername = username;
    socket.emit('user-join', username);
    
    usernameDisplay.textContent = username;
    joinModal.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    inputArea.classList.remove('hidden');
    messageInput.disabled = false;
    sendBtn.disabled = false;
    messageInput.focus();

    console.log(`Joined as ${username}`);
}

// Send message
function sendMessage() {
    const text = messageInput.value.trim();
    
    if (!text) return;
    // If user typed the command to call AI, open the AI call instead
    if (text.toLowerCase() === '.callai') {
        const aiUserObj = { id: 'ai', username: 'Oddych-AI', role: 'bot' };
        messageInput.value = '';
        openAICall(aiUserObj);
        return;
    }

    socket.emit('send-message', { text });
    messageInput.value = '';
    messageInput.focus();
    socket.emit('user-stop-typing');
    typingIndicator.classList.add('hidden');
}

// Typing indicator
function handleTyping() {
    if (!messageInput.value.trim()) {
        socket.emit('user-stop-typing');
        typingIndicator.classList.add('hidden');
        return;
    }

    socket.emit('user-typing');

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('user-stop-typing');
    }, 2000);
}

// Event Listeners - Join Modal
joinBtn.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinChat();
});

// Open registration modal
if (openRegisterBtn) {
    openRegisterBtn.addEventListener('click', () => {
        registerModal.classList.remove('hidden');
        joinModal.classList.add('hidden');
        registerUsername.focus();
    });
}

// Close registration modal
if (closeRegisterBtn) {
    closeRegisterBtn.addEventListener('click', () => {
        registerModal.classList.add('hidden');
        joinModal.classList.remove('hidden');
        usernameInput.focus();
    });
}

// Handle registration
if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
        const name = registerUsername.value.trim();
        const email = registerEmail.value.trim();
        const password = registerPassword.value;
        registerStatus.textContent = '';
        registerStatus.classList.remove('error');
        if (!name) {
            registerStatus.textContent = 'Enter a username';
            registerStatus.classList.add('error');
            return;
        }
        if (!email) {
            registerStatus.textContent = 'Enter a valid email';
            registerStatus.classList.add('error');
            return;
        }
        if (!password || password.length < 6) {
            registerStatus.textContent = 'Password must be at least 6 characters';
            registerStatus.classList.add('error');
            return;
        }
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: name, email, password })
            });
            const data = await res.json();
            if (!res.ok) {
                registerStatus.textContent = data.error || 'Registration failed';
                registerStatus.classList.add('error');
                return;
            }
            registerStatus.textContent = 'Registered successfully! Use your username to join.';
            registerStatus.classList.remove('error');
            registerStatus.classList.add('success');
            usernameInput.value = data.user.username;
            registerUsername.value = '';
            registerEmail.value = '';
            registerPassword.value = '';
            setTimeout(() => {
                registerModal.classList.add('hidden');
                joinModal.classList.remove('hidden');
                usernameInput.focus();
            }, 800);
        } catch (err) {
            console.error(err);
            registerStatus.textContent = 'Registration error';
            registerStatus.classList.add('error');
        }
    });
}

// Event Listeners - Chat Input
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
messageInput.addEventListener('input', handleTyping);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentUsername) {
        if (confirm('>>> QUIT CHAT? <<<')) {
            location.reload();
        }
    }
});

// Socket.io Events
socket.on('connect', () => {
    console.log('Connected to server');
    usernameInput.focus();
});

socket.on('load-messages', (messages) => {
    messagesDiv.innerHTML = '';
    messages.forEach(msg => {
        addMessage(msg);
    });
});

socket.on('receive-message', (message) => {
    addMessage(message);
});

socket.on('user-joined', (data) => {
    addSystemMessage(`${data.username} JOINED (Total: ${data.userCount})`);
    updateUsersList(data.users);
});

socket.on('user-left', (data) => {
    addSystemMessage(`${data.username} LEFT (Total: ${data.userCount})`);
    updateUsersList(data.users);
});

socket.on('user-typing', (data) => {
    typingUser.textContent = data.username;
    typingIndicator.classList.remove('hidden');
    
    setTimeout(() => {
        typingIndicator.classList.add('hidden');
    }, 3000);
});

socket.on('user-stop-typing', () => {
    typingIndicator.classList.add('hidden');
});

// Receive private message
socket.on('private-message', (payload) => {
    // payload: { from, fromId, text, timestamp }
    const id = payload.fromId || payload.from;
    const other = payload.from;
    const entry = { from: other, text: payload.text, timestamp: payload.timestamp || new Date().toISOString() };
    const history = odkazovacHistory.get(id) || [];
    history.push(entry);
    odkazovacHistory.set(id, history);

    if (currentOdkazovac && currentOdkazovac.id === id) {
        renderOdkazovacMessages();
        showOdkazovacAlert(`Nová správa od ${other}`);
    } else {
        setOdkazovacAlert();
        addSystemMessage(`Nová správa v odkazovači od ${other}`);
    }
});

// WebRTC signaling handlers
socket.on('webrtc-offer', async (payload) => {
    // payload: { from, fromId, sdp }
    try {
        const fromId = payload.fromId;
        const from = payload.from;
        currentCall = { id: fromId, username: from };
        callTitle.textContent = `Hovor od ${from}`;
        callModal.classList.remove('hidden');
        await startLocalStream();
        createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', { to: fromId, sdp: answer });
    } catch (err) {
        console.error('webrtc-offer error', err);
    }
});

socket.on('webrtc-answer', async (payload) => {
    try {
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    } catch (err) {
        console.error('webrtc-answer error', err);
    }
});

socket.on('webrtc-candidate', async (payload) => {
    try {
        if (!pc) return;
        if (payload && payload.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
    } catch (err) {
        console.error('webrtc-candidate error', err);
    }
});

socket.on('webrtc-end', (payload) => {
    endCall();
});

// AI call replies
socket.on('ai-call-reply', (payload) => {
    try {
        const aiMessages = document.getElementById('ai-call-messages');
        if (!aiMessages) return;
        const d = document.createElement('div');
        d.style.margin = '6px 0';
        d.innerHTML = `<strong>${escapeHtml(payload.from)}:</strong> ${escapeHtml(payload.text)}`;
        aiMessages.appendChild(d);
        aiMessages.scrollTop = aiMessages.scrollHeight;
        // speak using browser TTS
        if ('speechSynthesis' in window) {
            const u = new SpeechSynthesisUtterance(payload.text);
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(u);
        }
    } catch (err) {
        console.error('ai-call-reply handler error', err);
    }
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Initial focus
usernameInput.focus();
