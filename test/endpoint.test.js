const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadEngine() {
  const context = {
    console,
    document: {
      getElementById: function() { return null; },
      getElementsByTagName: function() { return []; }
    },
    location: {
      protocol: 'https:',
      host: 'play.example',
      pathname: '/'
    },
    window: {
      addEventListener: function() {}
    }
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
