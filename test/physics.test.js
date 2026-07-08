const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  BALL_SIZE,
  PADDLE_HEIGHT,
  SCORE_CAP,
  addPlayer,
  createGameState,
  playerCount,
  removePlayer,
  setInput,
  stepGame
} = require('../server/physics');

test('assigns first player left and second player right', function() {
  const state = createGameState();

  assert.equal(addPlayer(state, 'a'), 'left');
  assert.equal(addPlayer(state, 'b'), 'right');
  assert.equal(addPlayer(state, 'c'), null);
  assert.equal(playerCount(state), 2);
  assert.equal(state.phase, 'playing');
});

test('moves paddles from client input and clamps to the arena', function() {
  const state = createGameState();
  addPlayer(state, 'a');
  addPlayer(state, 'b');

  setInput(state, 'a', { up: true });
  stepGame(state, 10);

  assert.equal(state.paddles.leftY, 0);

  setInput(state, 'a', { up: false, down: true, turbo: true });
  stepGame(state, 10);

  assert.equal(state.paddles.leftY, ARENA_HEIGHT - PADDLE_HEIGHT);
});

test('launches the ball after the serve delay', function() {
  const state = createGameState();
  addPlayer(state, 'a');
  addPlayer(state, 'b');

  assert.equal(state.ball.vx, 0);
  stepGame(state, 0.5);
  assert.equal(state.ball.vx, 0);
  stepGame(state, 0.6);
  assert.notEqual(state.ball.vx, 0);
});

test('scores and ends the game at the score cap', function() {
  const state = createGameState();
  addPlayer(state, 'a');
  addPlayer(state, 'b');

  state.scores.left = SCORE_CAP - 1;
  state.ball.x = ARENA_WIDTH - BALL_SIZE + 1;
  state.ball.y = 100;
  state.ball.vx = 300;
  state.ball.vy = 0;
  state.serveTimer = 0;

  stepGame(state, 0.016);

  assert.equal(state.scores.left, SCORE_CAP);
  assert.equal(state.phase, 'ended');
  assert.equal(state.winner, 'left');
});

test('marks opponent as left when a player disconnects', function() {
  const state = createGameState();
  addPlayer(state, 'a');
  addPlayer(state, 'b');

  assert.equal(removePlayer(state, 'b'), 'right');
  assert.equal(state.phase, 'ended');
  assert.equal(state.message, 'Opponent left');
  assert.equal(state.winner, 'left');
  assert.equal(playerCount(state), 1);
});
