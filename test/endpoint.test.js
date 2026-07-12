const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadEngine() {
  const windowListeners = {};
  const documentListeners = {};
  const elements = {
    onlineBack: { style: {}, className: 'button back' },
    onlineCancel: { style: {}, className: 'button' },
    onlineQuick: { style: {}, className: 'button' },
    onlineCreate: { style: {}, className: 'button' },
    onlineJoin: { style: {}, className: 'button' },
    onlineStatus: { style: {}, className: 'cell', innerHTML: '' },
    UI: { style: {}, className: '' },
    'main-info': { style: {}, className: '' }
  };
  const context = {
    console,
    document: {
      hidden: false,
      getElementById: function(id) { return elements[id] || null; },
      getElementsByTagName: function() { return []; },
      addEventListener: function(type, listener) { documentListeners[type] = listener; }
    },
    location: {
      protocol: 'https:',
      host: 'play.example',
      pathname: '/'
    },
    window: {
      addEventListener: function(type, listener) { windowListeners[type] = listener; }
    },
    windowListeners,
    documentListeners,
    elements
  };

  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, '..', 'javascript', 'engine.js'), 'utf8'),
    context
  );
  return context;
}

test('builds Colyseus endpoint from the current mount path', function() {
  const context = loadEngine();

  context.location.pathname = '/';
  assert.equal(context.onlineEndpoint(), 'wss://play.example');

  context.location.pathname = '/pong/';
  assert.equal(context.onlineEndpoint(), 'wss://play.example/pong');

  context.location.pathname = '/pong/index.html';
  assert.equal(context.onlineEndpoint(), 'wss://play.example/pong');
});

test('releases online input when the window loses focus', function() {
  const context = loadEngine();
  const messages = [];

  context.online.room = {
    send: function(type, message) { messages.push({ type, message }); }
  };
  context.online.keys = { up: true, down: false, turbo: true };
  context.online.lastSent = { up: true, down: false, turbo: true };

  context.windowListeners.blur();

  assert.equal(messages.length, 1);
  assert.equal(messages[0].type, 'input');
  assert.equal(messages[0].message.up, false);
  assert.equal(messages[0].message.down, false);
  assert.equal(messages[0].message.turbo, false);
});

test('cancels an online room and restores the menu state', function() {
  const context = loadEngine();
  let leaves = 0;

  context.online.busy = true;
  context.online.room = {
    send: function() {},
    leave: function() { leaves += 1; }
  };
  context.cancelOnline();

  assert.equal(leaves, 1);
  assert.equal(context.online.room, null);
  assert.equal(context.online.busy, false);
  assert.equal(context.elements.onlineCancel.style.display, 'none');
  assert.equal(context.elements.onlineBack.style.display, '');
  assert.equal(context.elements.UI.style.display, 'none');
  assert.equal(context.elements['main-info'].style.display, '');
  assert.equal(context.elements.onlineStatus.innerHTML, 'Matchmaking cancelled.');
});
