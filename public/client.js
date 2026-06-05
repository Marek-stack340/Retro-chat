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

let currentUsername = '';
let typingTimeout = null;
let dmModal = document.getElementById('dm-modal');
let dmTitle = document.getElementById('dm-title');
let dmMessages = document.getElementById('dm-messages');
let dmInput = document.getElementById('dm-input');
let dmSend = document.getElementById('dm-send');
let dmClose = document.getElementById('dm-close');
let currentDM = null; // { id, username }
const dmHistory = new Map();

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

        const dmBtn = document.createElement('button');
        dmBtn.className = 'retro-button';
        dmBtn.style.padding = '6px 10px';
        dmBtn.style.fontSize = '11px';
        dmBtn.textContent = 'DM';
        dmBtn.title = `Súkromná správa ${user.username}`;
        dmBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openDM(user);
        });

        li.appendChild(nameSpan);
        li.appendChild(dmBtn);
        usersList.appendChild(li);
    });
    userCount.textContent = `Users: ${users.length}`;
}

// Open DM modal
function openDM(user) {
    if (!user || !user.id) return;
    currentDM = { id: user.id, username: user.username };
    dmTitle.textContent = `Súkromná: ${user.username}`;
    dmModal.classList.remove('hidden');
    renderDM();
    dmInput.focus();
}

function closeDM() {
    currentDM = null;
    dmModal.classList.add('hidden');
}

function renderDM() {
    dmMessages.innerHTML = '';
    if (!currentDM) return;
    const history = dmHistory.get(currentDM.id) || [];
    history.forEach(m => {
        const d = document.createElement('div');
        d.style.marginBottom = '6px';
        d.innerHTML = `<strong>${escapeHtml(m.from)}:</strong> ${escapeHtml(m.text)} <span style="color:rgba(0,0,0,0.4);font-size:11px">${formatTime(m.timestamp)}</span>`;
        dmMessages.appendChild(d);
    });
    dmMessages.scrollTop = dmMessages.scrollHeight;
}

// Send private message
function sendPrivateMessage() {
    if (!currentDM) return;
    const text = dmInput.value.trim();
    if (!text) return;
    socket.emit('private-message', { to: currentDM.id, text });
    // add to local history as sent
    const entry = { from: currentUsername, text, timestamp: new Date().toISOString() };
    const history = dmHistory.get(currentDM.id) || [];
    history.push(entry);
    dmHistory.set(currentDM.id, history);
    dmInput.value = '';
    renderDM();
}

dmSend.addEventListener('click', sendPrivateMessage);
dmClose.addEventListener('click', closeDM);
dmInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendPrivateMessage(); });

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
    const history = dmHistory.get(id) || [];
    history.push(entry);
    dmHistory.set(id, history);
    // If DM modal with this user open, render; otherwise show system message
    if (currentDM && currentDM.id === id) {
        renderDM();
    } else {
        addSystemMessage(`Súkromná správa od ${other}`);
    }
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Initial focus
usernameInput.focus();
