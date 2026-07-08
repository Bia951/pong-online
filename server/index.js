const path = require('node:path');
const { Server, WebSocketTransport } = require('colyseus');
const express = require('express');
const { PongRoom } = require('./PongRoom');

const PORT = Number(process.env.PORT || 2567);
const ROOT = path.resolve(__dirname, '..');
const SDK_BUNDLE = path.join(ROOT, 'node_modules', '@colyseus', 'sdk', 'dist', 'colyseus.js');

const gameServer = new Server({
  transport: new WebSocketTransport(),
  greet: true
});

const app = gameServer.transport.getExpressApp();

app.get('/health', function(req, res) {
  res.json({ ok: true });
});

app.get('/vendor/colyseus.js', function(req, res) {
  res.sendFile(SDK_BUNDLE);
});

app.use(express.static(ROOT));

gameServer.define('pong', PongRoom);

gameServer.listen(PORT).then(function() {
  console.log('Browser Pong server listening on http://127.0.0.1:' + PORT);
}).catch(function(error) {
  console.error(error);
  process.exit(1);
});
