const socket = io();
const messagesDiv = document.getElementById('messages');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const usernameInput = document.getElementById('username-input');

function addMessage(m) {
  const d = document.createElement('div');
  d.className = 'msg';
  d.innerHTML = `<strong>${escapeHtml(m.username)}</strong>: ${escapeHtml(m.text)}`;
  messagesDiv.appendChild(d);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHtml(s) { return (s||'').toString().replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

socket.on('load-messages', (msgs) => { messagesDiv.innerHTML = ''; msgs.forEach(addMessage); });
socket.on('receive-message', addMessage);

sendBtn.addEventListener('click', () => {
  const text = messageInput.value.trim();
  const username = usernameInput.value.trim() || 'Anon';
  if (!text) return;
  socket.emit('send-message', { username, text });
  messageInput.value = '';
});

messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendBtn.click(); });
