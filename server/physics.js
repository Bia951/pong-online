const ARENA_WIDTH = 900;
const ARENA_HEIGHT = 550;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 15;
const LEFT_X = 50;
const RIGHT_X = ARENA_WIDTH - 65;
const SCORE_CAP = 10;
const PADDLE_SPEED = 300;
const PADDLE_TURBO_SPEED = 650;
const BALL_BASE_SPEED = 300;
const BALL_CHAIN_BOOST = 16;
const BALL_MAX_SPEED = 680;
const SERVE_DELAY = 1;

function createGameState() {
  return {
    phase: 'waiting',
    roomId: '',
    message: 'Waiting for opponent...',
    leftSessionId: null,
    rightSessionId: null,
    paddles: {
      leftY: centerPaddle(),
      rightY: centerPaddle()
    },
    ball: {
      x: centerBallX(),
      y: centerBallY(),
      vx: 0,
      vy: 0,
      pendingDirection: 'right'
    },
    scores: {
      left: 0,
      right: 0
    },
    chain: 0,
    bestChain: 0,
    winner: '',
    inputs: {},
    event: '',
    eventSeq: 0,
    serveTimer: 0
  };
}

function addPlayer(state, sessionId) {
  if (state.leftSessionId === sessionId) return 'left';
  if (state.rightSessionId === sessionId) return 'right';

  var side = null;
  if (!state.leftSessionId) {
    state.leftSessionId = sessionId;
    side = 'left';
  } else if (!state.rightSessionId) {
    state.rightSessionId = sessionId;
    side = 'right';
  }

  if (!side) return null;

  state.inputs[sessionId] = blankInput();
  state.message = playerCount(state) < 2 ? 'Waiting for opponent...' : '';

  if (playerCount(state) === 2 && state.phase !== 'playing') {
    startMatch(state);
  }

  return side;
}

function removePlayer(state, sessionId) {
  var side = sideForSession(state, sessionId);
  if (!side) return null;

  if (side === 'left') state.leftSessionId = null;
  if (side === 'right') state.rightSessionId = null;
  delete state.inputs[sessionId];

  if (playerCount(state) > 0) {
    state.phase = 'ended';
    state.message = 'Opponent left';
    state.winner = side === 'left' ? 'right' : 'left';
    emit(state, 'leave');
  } else {
    state.phase = 'waiting';
    state.message = 'Waiting for opponent...';
    state.winner = '';
  }

  return side;
}

function setInput(state, sessionId, input) {
  if (!state.inputs[sessionId]) state.inputs[sessionId] = blankInput();
  state.inputs[sessionId].up = input && input.up === true;
  state.inputs[sessionId].down = input && input.down === true;
  state.inputs[sessionId].turbo = input && input.turbo === true;
}

function startMatch(state) {
  state.phase = 'playing';
  state.message = '';
  state.winner = '';
  state.scores.left = 0;
  state.scores.right = 0;
  state.chain = 0;
  state.bestChain = 0;
  state.paddles.leftY = centerPaddle();
  state.paddles.rightY = centerPaddle();
  resetBall(state, Math.random() < 0.5 ? 'left' : 'right');
  emit(state, 'start');
}

function stepGame(state, deltaSeconds) {
  if (state.phase !== 'playing') return;

  movePaddle(state, 'left', deltaSeconds);
  movePaddle(state, 'right', deltaSeconds);

  if (state.serveTimer > 0) {
    state.serveTimer = Math.max(0, state.serveTimer - deltaSeconds);
    if (state.serveTimer === 0) launchBall(state);
    return;
  }

  state.ball.x += state.ball.vx * deltaSeconds;
  state.ball.y += state.ball.vy * deltaSeconds;

  collideWalls(state);
  collidePaddles(state);
  scoreGoals(state);
}

function serializeState(state) {
  return {
    phase: state.phase,
    roomId: state.roomId,
    width: ARENA_WIDTH,
    height: ARENA_HEIGHT,
    scoreCap: SCORE_CAP,
    message: state.message,
    players: {
      left: Boolean(state.leftSessionId),
      right: Boolean(state.rightSessionId)
    },
    paddles: {
      left: { x: LEFT_X, y: state.paddles.leftY, width: PADDLE_WIDTH, height: PADDLE_HEIGHT },
      right: { x: RIGHT_X, y: state.paddles.rightY, width: PADDLE_WIDTH, height: PADDLE_HEIGHT }
    },
    ball: {
      x: state.ball.x,
      y: state.ball.y,
      size: BALL_SIZE
    },
    scores: {
      left: state.scores.left,
      right: state.scores.right
    },
    chain: state.chain,
    bestChain: state.bestChain,
    winner: state.winner,
    event: state.event,
    eventSeq: state.eventSeq
  };
}

function sideForSession(state, sessionId) {
  if (state.leftSessionId === sessionId) return 'left';
  if (state.rightSessionId === sessionId) return 'right';
  return null;
}

function playerCount(state) {
  return (state.leftSessionId ? 1 : 0) + (state.rightSessionId ? 1 : 0);
}

function blankInput() {
  return { up: false, down: false, turbo: false };
}

function movePaddle(state, side, deltaSeconds) {
  var sessionId = side === 'left' ? state.leftSessionId : state.rightSessionId;
  if (!sessionId) return;

  var input = state.inputs[sessionId] || blankInput();
  var speed = input.turbo ? PADDLE_TURBO_SPEED : PADDLE_SPEED;
  var key = side === 'left' ? 'leftY' : 'rightY';

  if (input.up && !input.down) state.paddles[key] -= speed * deltaSeconds;
  if (input.down && !input.up) state.paddles[key] += speed * deltaSeconds;

  state.paddles[key] = clamp(state.paddles[key], 0, ARENA_HEIGHT - PADDLE_HEIGHT);
}

function collideWalls(state) {
  if (state.ball.y <= 0) {
    state.ball.y = 0;
    state.ball.vy = Math.abs(state.ball.vy);
    emit(state, 'wall');
  } else if (state.ball.y >= ARENA_HEIGHT - BALL_SIZE) {
    state.ball.y = ARENA_HEIGHT - BALL_SIZE;
    state.ball.vy = -Math.abs(state.ball.vy);
    emit(state, 'wall');
  }
}

function collidePaddles(state) {
  if (state.ball.vx < 0 && overlapsPaddle(state, 'left')) {
    state.ball.x = LEFT_X + PADDLE_WIDTH;
    bounceFromPaddle(state, 'left', 1);
  } else if (state.ball.vx > 0 && overlapsPaddle(state, 'right')) {
    state.ball.x = RIGHT_X - BALL_SIZE;
    bounceFromPaddle(state, 'right', -1);
  }
}

function overlapsPaddle(state, side) {
  var paddleX = side === 'left' ? LEFT_X : RIGHT_X;
  var paddleY = side === 'left' ? state.paddles.leftY : state.paddles.rightY;

  return state.ball.x <= paddleX + PADDLE_WIDTH &&
    state.ball.x + BALL_SIZE >= paddleX &&
    state.ball.y <= paddleY + PADDLE_HEIGHT &&
    state.ball.y + BALL_SIZE >= paddleY;
}

function bounceFromPaddle(state, side, direction) {
  var paddleY = side === 'left' ? state.paddles.leftY : state.paddles.rightY;
  var paddleCenter = paddleY + PADDLE_HEIGHT / 2;
  var ballCenter = state.ball.y + BALL_SIZE / 2;
  var offset = clamp((ballCenter - paddleCenter) / (PADDLE_HEIGHT / 2), -1, 1);
  var speed = Math.min(BALL_MAX_SPEED, BALL_BASE_SPEED + state.chain * BALL_CHAIN_BOOST);

  state.ball.vx = direction * speed;
  state.ball.vy = offset * speed * 0.75;
  state.chain += 1;
  state.bestChain = Math.max(state.bestChain, state.chain);
  emit(state, 'hit');
}

function scoreGoals(state) {
  if (state.ball.x < 0) {
    scorePoint(state, 'right');
  } else if (state.ball.x > ARENA_WIDTH - BALL_SIZE) {
    scorePoint(state, 'left');
  }
}

function scorePoint(state, side) {
  state.scores[side] += 1;
  state.chain = 0;

  if (state.scores[side] >= SCORE_CAP) {
    state.phase = 'ended';
    state.winner = side;
    state.message = side === 'left' ? 'Player 1 won !' : 'Player 2 won !';
    state.ball.vx = 0;
    state.ball.vy = 0;
    emit(state, 'gameover');
    return;
  }

  resetBall(state, side === 'left' ? 'left' : 'right');
  emit(state, 'goal');
}

function resetBall(state, direction) {
  state.ball.x = centerBallX();
  state.ball.y = centerBallY();
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.ball.pendingDirection = direction;
  state.serveTimer = SERVE_DELAY;
}

function launchBall(state) {
  var direction = state.ball.pendingDirection === 'left' ? -1 : 1;
  state.ball.vx = BALL_BASE_SPEED * direction;
  state.ball.vy = 0;
}

function centerPaddle() {
  return ARENA_HEIGHT / 2 - PADDLE_HEIGHT / 2;
}

function centerBallX() {
  return ARENA_WIDTH / 2 - BALL_SIZE / 2;
}

function centerBallY() {
  return ARENA_HEIGHT / 2 - BALL_SIZE / 2;
}

function emit(state, event) {
  state.event = event;
  state.eventSeq += 1;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

module.exports = {
  ARENA_WIDTH,
  ARENA_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  BALL_SIZE,
  LEFT_X,
  RIGHT_X,
  SCORE_CAP,
  createGameState,
  addPlayer,
  removePlayer,
  setInput,
  stepGame,
  serializeState,
  sideForSession,
  playerCount
};
