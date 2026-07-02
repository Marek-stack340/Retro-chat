const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

const messages = [];
const users = new Map();

const curseWords = ['hovno', 'kurva', 'kokot', 'sranie', 'sračky', 'debil', 'blbec', 'piča', 'chuj', 'zmetok', 'sprostost', 'nadavka', 'nadávka', 'fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap', 'fucker', 'motherfucker', 'slut', 'whore'];

function hashtagCurseWords(text) {
  if (!text) return text;
  return text.replace(/\b([a-zA-ZáäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ]+)\b/g, (match) => {
    const lower = match.toLowerCase();
    if (curseWords.includes(lower)) {
      return `#${lower}`;
    }
    return match;
  });
}

function broadcastUserList() {
  io.emit('user-list', Array.from(users.values()));
}

io.on('connection', (socket) => {
  console.log('connected', socket.id);
  socket.emit('load-messages', messages);
  socket.emit('user-list', Array.from(users.values()));

  socket.on('join', (data) => {
    const username = data && data.username ? data.username.toString().trim() : 'Anon';
    const safeUsername = username || 'Anon';
    users.set(socket.id, { id: socket.id, username: safeUsername });
    broadcastUserList();
  });

  socket.on('send-message', (data) => {
    const msg = {
      id: Date.now(),
      username: data.username || 'Anon',
      text: hashtagCurseWords(data.text || ''),
      timestamp: new Date().toISOString()
    };
    messages.push(msg);
    io.emit('receive-message', msg);
  });

  socket.on('send-private-message', (data) => {
    const user = users.get(socket.id);
    const text = data && data.text ? hashtagCurseWords(data.text.toString().trim()) : '';
    const toId = data && data.to;
    if (!user || !toId || !text) return;

    const payload = {
      id: Date.now(),
      from: user.username,
      to: toId,
      text,
      timestamp: new Date().toISOString(),
      self: false
    };

    const targetSocket = io.sockets.sockets.get(toId);
    if (targetSocket) {
      targetSocket.emit('receive-private-message', payload);
    }

    socket.emit('receive-private-message', {
      ...payload,
      self: true,
      toUsername: users.get(toId) ? users.get(toId).username : 'niekto'
    });
  });

  socket.on('disconnect', () => {
    console.log('disconnected', socket.id);
    users.delete(socket.id);
    broadcastUserList();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`New chat running on http://localhost:${PORT}`));
