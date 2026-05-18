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
        li.textContent = user.username;
        usersList.appendChild(li);
    });
    userCount.textContent = `Users: ${users.length}`;
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

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Initial focus
usernameInput.focus();
