const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

const messages = [];

io.on('connection', (socket) => {
  console.log('connected', socket.id);
  socket.emit('load-messages', messages);

  socket.on('send-message', (data) => {
    const msg = { id: Date.now(), username: data.username || 'Anon', text: data.text || '', timestamp: new Date().toISOString() };
    messages.push(msg);
    io.emit('receive-message', msg);
  });

  socket.on('disconnect', () => {
    console.log('disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`New chat running on http://localhost:${PORT}`));
