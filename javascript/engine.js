/* USEFUL INFO
* startGame() arguments
* type refers to the game type
* 0 = One Player
* 1 = CPU vs CPU
*
* mode refers to the difficulty
* 0 = very easy
* 1 = easy
* 2 = normal
* 3 = hard
* 4 = inhuman
*
* The speed variable determines how fast the ball moves
*
* The chain variable, every time the ball hits a paddle it subtracts speed by chain
* basically subtracting 1 each hit until it reaches 1ms, the limit.
*/

// custom graphics and colors for our paddles and ball
// this will change depending if the player chooses a preset or makes their own
var custom = {
  paddle : 'graphics/p_default.gif',
  ball : 'graphics/b_default.gif',
  id : 'ball',
  color : 'none'
}, paused = false, started = false; // helpful for checking if the game is paused or started.

// triggered by one of the many difficulty buttons
// did you know the type is determined by the modeList className ?
function startGame(type, mode) {
    if (started) return;
	started = true;
	
	// this hides a bunch of menus so they're not in the player's way when the game starts
	hide(getId('main-info'));
    for (var i=0, menus = document.getElementsByTagName('DIV'); i<menus.length; i++) if (/menu/.test(menus[i].className)) hide(menus[i]);
	  
  var wX = window.innerWidth, wY = window.innerHeight,
      scorep1 = 0, scorep2 = 0,
	  cap = cNum('cap',1),
      speed = cNum('speed',45),
	  chain = 0, best_chain = 0,
	  
	  ball = new Ball(),
      player1 = new Paddle('p1'),
      player2 = new Paddle('p2'),
	  controls_p1 = 'idle',
	  localKeys = { up:false, down:false, turbo:false },
	  controlTimer = null,
	  difficulty = [ 1,1 ], gameEnded = false;
	  
	  
  if (mode == 0) difficulty = [ 40,25 ]; // very easy
  if (mode == 1) difficulty = [ 30,20 ]; // easy
  if (mode == 2) difficulty = [ 20,15 ]; // normal
  if (mode == 3) difficulty = [ 10,1 ]; // hard
  if (mode == 4) difficulty = [ 3,1 ]; // inhuman
	  
  show(getId('UI')); // show UI
	  
  // set the coords of p1 and p2
  player1.setCoords(50,wY / 2 - 50);
  player2.setCoords(wX - 65, wY / 2 - 50);
  ball.reset(); // set the ball
  window.setTimeout(function() { ball.dir('random'), ball.animate(speed) },1000);
  
  // check game mode
  if (type == 0) initCPU(player2, difficulty[1]);
  if (type == 1) initCPU(player1, difficulty[1]), initCPU(player2, difficulty[1]);
  
  // paddle
  function Paddle(classname) {
    this.el = document.createElement('IMG');
	this.el.src = custom.paddle;
	if (custom.color != 'none') this.el.style.background = custom.color;
	this.el.className = 'paddle '+classname;
	this.setCoords = function(x,y) { this.el.style.left = Math.floor(x)+'px', this.el.style.top = Math.floor(y)+'px' };
	this.up = function() { this.el.style.top = getY(this.el) - 10 + 'px' };
	this.down = function() { this.el.style.top = getY(this.el) + 10 + 'px' };
	
	document.body.insertBefore(this.el,document.body.firstChild);
  };
  
  // ball
  function Ball() {
    this.el = document.createElement('IMG');
	this.el.src = custom.ball;
	if (custom.color != 'none') this.el.style.background = custom.color;
	this.el.id = custom.id;
	this.reset = function() { this.el.style.left = Math.floor(wX / 2)+'px', this.el.style.top = Math.floor(wY / 2)+'px' };
	this.dir = function(type) {
	  var r = Math.floor(Math.random() * 2), d;
	  if (type == 'random') {
	    if (r == 0) d = 'left_X10_Y0';
		if (r == 1) d = 'right_X10_Y0';
	  } else d = type;
	
	  this.el.className = d
	};
	
	// ball movement methods
    this.up = function() { this.el.style.top = getY(this.el) - sY() + 'px' };
	this.left = function() { this.el.style.left = getX(this.el) - sX() + 'px' };
	this.right = function() { this.el.style.left = getX(this.el) + sX() + 'px' };
	this.down = function() { this.el.style.top = getY(this.el) + sY() + 'px' };
	
	// ball animation
	this.animate = function(refresh) {
      var ball_animation = window.setInterval(function() {
	    if (gameEnded) return window.clearInterval(ball_animation);
	    if (paused) return;
        var chain_speed = 0, bX = getX(ball.el), bY = getY(ball.el);
	  
	    /* -- START window hitboxes -- */
	    if (bX < 0) return clear(), goal('p2', 'right_X10_Y0'); // left side is p1, so p2 gets +1
	    if (bX > wX - 15) return clear(), goal('p1', 'left_X10_Y0'); // right side is p2, so p1 gets +1
		
		// top / bottom right
		if (bY < 0 && ballDir('top-r')) sfx('collfx'), ball.dir('down-r_X10_Y'+sY());
		if (bY > wY - 15 && ballDir('down-r')) sfx('collfx'), ball.dir('top-r_X10_Y'+sY());
		
		// top / bottom left
		if (bY < 0 && ballDir('top-l')) sfx('collfx'), ball.dir('down-l_X10_Y'+sY());
		if (bY > wY - 15 && ballDir('down-l')) sfx('collfx'), ball.dir('top-l_X10_Y'+sY());
		/* -- END window hitboxes -- */
		
		
		/* -- START paddle hitboxes -- */
		hitbox(0, 10, 'top-r_X10_Y10', 'top-l_X10_Y10'); 
		hitbox(10, 20, 'top-r_X10_Y8', 'top-l_X10_Y8');
		hitbox(20, 30, 'top-r_X10_Y6', 'top-l_X10_Y6');
		hitbox(30, 40, 'top-r_X10_Y4', 'top-l_X10_Y4');
		hitbox(40, 50, 'top-r_X10_Y2', 'top-l_X10_Y2');
		hitbox(50, 60, 'top-r_X10_Y1', 'top-l_X10_Y1');
		hitbox(60, 70, 'down-r_X10_Y1', 'down-l_X10_Y1');
		hitbox(70, 80, 'down-r_X10_Y2', 'down-l_X10_Y2');
		hitbox(80, 90, 'down-r_X10_Y4', 'down-l_X10_Y4');
		hitbox(90, 100, 'down-r_X10_Y6', 'down-l_X10_Y6');
		hitbox(100, 110, 'down-r_X10_Y8', 'down-l_X10_Y8');
		hitbox(110, 120, 'down-r_X10_Y10', 'down-l_X10_Y10');
		/* -- END paddle hitboxes -- */
		
		// ball directions
	    if (ballDir('left')) ball.left();
	    if (ballDir('right')) ball.right();
		if (ballDir('top-r')) ball.right(), ball.up();
		if (ballDir('down-r')) ball.right(), ball.down();
		if (ballDir('top-l')) ball.left(), ball.up();
		if (ballDir('down-l')) ball.left(), ball.down();
		
		// generate hitboxes for the paddles
		// we want a hitbox of about 15px wide and 100px tall
		// start refers to the Y-offset we want to start at e.g. 0px
		// end refers to the Y-offset we want to stop at e.g. 40px
		// dir1 and dir2 will be used as arguments in hit(), check the conditions below ;)
		function hitbox(start, end, dir1, dir2) {
		  var incY = start;
          while (incY < end) {
	        var incX = 0;
	        while (incX < 16) {
			  // we subtract 15 from the top of our paddles as the ball is 15 tall
			  // this will allow us to set a somewhat accurate and larger hitbox
	          if (bY == getY(player1.el) - 15 + incY && bX == getX(player1.el) + incX) hit(dir1); // player1
			  if (bY == getY(player2.el) - 15 + incY && bX == getX(player2.el) - incX) hit(dir2); // player2
		      incX++
	        }
	        incY++
          }
		  // function to run when a hit is detected, the direction is different depending on the player
		  function hit(dir) {
		    chain += 1, incY = 999, incX = 999;
		    if (speed - chain > 1) chain_speed = speed - chain;
		    else chain_speed = 1;
			sfx('hitfx'), clear(), ball.dir(dir), ball.animate(chain_speed), syncUI();
		  }
		};
		function clear() { window.clearInterval(ball_animation) };
	  },refresh);
	}
	
	document.body.insertBefore(this.el,document.body.firstChild);
  };
  
  
  // key functions
  document.onkeydown = function keyMovement(e) {
    if (gameEnded) return; // completely ignore if the game is over
	
	// use key or keyCode depending on what's supported
	if (e.key) var keyId = e.key.toLowerCase().replace(/arrow/, ''), up = 'up', down = 'down', w = 'w', s = 's', p = 'p';
	else if (e.keyCode) var keyId = e.which || e.keyCode, up = 38, down = 40, w = 87, s = 83, p = 80;
	else return domAlert('Error','Sorry, no key identifiers are supported.','<div class="button" onclick="window.location.reload();">OK</div>');
  
    if (!paused && keyId == p) pause(), pD();
    else if (paused && keyId == p) resume(), pD();
  
	if (type == 1) return; // we ignore input if the mode is CPU vs CPU

	if (keyId == up || keyId == w) localKeys.up = true, updatePlayerControl(), pD();
	if (keyId == down || keyId == s) localKeys.down = true, updatePlayerControl(), pD();
	if (keyId == 'shift' || keyId == 16) localKeys.turbo = true, updatePlayerControl(), pD();
	function pD() { e.preventDefault() }
  };

  document.onkeyup = function(e) {
    var keyId = e.key ? e.key.toLowerCase().replace(/arrow/, '') : e.which || e.keyCode,
        handled = false;

    if (keyId == 'up' || keyId == 'w' || keyId == 38 || keyId == 87) localKeys.up = false, handled = true;
    if (keyId == 'down' || keyId == 's' || keyId == 40 || keyId == 83) localKeys.down = false, handled = true;
    if (keyId == 'shift' || keyId == 16) localKeys.turbo = false, handled = true;
    if (handled) updatePlayerControl(), e.preventDefault();
  };

  window.addEventListener('blur', function() {
    localKeys = { up:false, down:false, turbo:false };
    updatePlayerControl();
  });

  // main movement of the player
  function updatePlayerControl() {
    window.clearInterval(controlTimer);
    controlTimer = null;
    controls_p1 = localKeys.up == localKeys.down ? 'idle' : (localKeys.up ? 'up' : 'down');
    if (controls_p1 == 'idle') return;

    movePlayer();
    controlTimer = window.setInterval(movePlayer, localKeys.turbo ? 1:cNum('sens',25));
  };

  function movePlayer() {
    if (gameEnded) return window.clearInterval(controlTimer);
    if (paused) return;
    if (controls_p1 == 'up') player1.up();
    if (controls_p1 == 'down') player1.down();
    if (getY(player1.el) < 0) player1.setCoords(50,0);
    if (getY(player1.el) > wY - 100) player1.setCoords(50,wY - 100);
  };
  
  /* -- START CPU -- */
  function initCPU(o,r,nl,tl) {
    // the CPU will move between 0 and 100 to allow variation
	// additionally the refresh of the next interval is randomized
    var n = nl || 0, t = tl || 'inc', ref = Math.floor( Math.random() * difficulty[0] ) + difficulty[1], CPU = window.setInterval(function() {
	  if (gameEnded) return window.clearInterval(CPU);
	  if (paused) return;
      movement(o, n);
	  if (t=='inc') {
	    n++;
		if (n > 100) t = 'dec'
	  } else if (t=='dec') {
	    n--;
		if (n < 1) t = 'inc'
	  }
	},r);
	
	// movement of the CPU resides in this function
	// arguments are passed from the interval which contains the object and offset
	function movement(o,n) {
	  if (getY(ball.el) - n < getY(o.el)) o.up();
	  if (getY(ball.el) - n > getY(o.el)) o.down();
		
	  if (o==player2) {
	    if (getY(o.el) < 0) o.setCoords(wX - 65,0);
	    if (getY(o.el) > wY - 100) o.setCoords(wX - 65,wY - 100);
	  } else if (o==player1) {
	    if (getY(o.el) < 0) o.setCoords(50,0);
	    if (getY(o.el) > wY - 100) o.setCoords(50,wY - 100);
	  }
	};
	
	// to allow variation in the CPU
	// the speed is randomized every second
	window.setTimeout(function() {
	  window.clearInterval(CPU);
      if (!gameEnded) initCPU(o, ref, n, t);
	},1000);
  }
  /* -- END CPU -- */
  
  // update various variables
  // it also updates the score in game
  function syncUI() {
    getId('p1').innerHTML = scorep1;
	getId('p2').innerHTML = scorep2;
	
	// chains
    var chainLevel = 'zeroChain';
	if (chain >= 1) chainLevel = 'goodChain';
	if (chain >= 25) chainLevel = 'greatChain';
	if (chain >= 50) chainLevel = 'superChain';
	getId('chain').className = chainLevel;
	getId('chain').innerHTML = chain;
	
	if (chain > best_chain) {
	  best_chain = chain;
	  getId('bestChain').innerHTML = best_chain;
	}
  };
  
  // triggered when the ball hits the left or right corner of the screen
  // adds to score, changes ball directions, and resets some stuff
  function goal(p,d) {
    if (p == 'p1') {
	  scorep1 += 1;
	  if (scorep1 >= cap) gameOver();
	}
	if (p == 'p2') {
	  scorep2 += 1;
	  if (scorep2 >= cap) gameOver();
	}
    chain = 0;
    sfx('goalfx'), ball.reset(), syncUI();
    setTimeout(function() { ball.dir(d), ball.animate(speed) },1000);
  };
  
  // game over
  // ends the game when the score cap has been reached
  // additionally it can be triggered from the pause menu
  function gameOver() {
  
    gameEnded = true;
	var winner, gameType, gameMode, p1w='', p2w='', name1, name2;
	
	// check type and set names
	if (type == 0) gameType = 'One Player', name1 = 'You', name2 = 'CPU';
	else gameType = 'CPU vs CPU', name1 = 'CPU1', name2 = 'CPU2';
	
	// check who won
	if (scorep1 > scorep2) winner = name1 + ' won !', p1w = 'winner';
	else if (scorep1 < scorep2) winner = name2 + ' won !', p2w = 'winner';
	else winner = 'Draw !'
	
	// check mode
	if (mode == 0) gameMode = 'Very Easy';
	if (mode == 1) gameMode = 'Easy';
	if (mode == 2) gameMode = 'Normal';
	if (mode == 3) gameMode = 'Hard';
	if (mode == 4) gameMode = 'Inhuman';
	
	// put together the statistics
	getId('gameWinner').innerHTML = winner;
	getId('gameType').innerHTML = '<span class="label">Game Type&nbsp;</span><span class="value">' + gameType + '</span>';
	getId('gameMode').innerHTML = '<span class="label">Difficulty&nbsp;</span><span class="value ' + gameMode.slice(0,1).toLowerCase() + gameMode.slice(1).replace(/\s/,'') + '">' + gameMode + '</span>';
	getId('gameScore1').innerHTML = '<span class="label '+ p1w +'">Player 1 Score&nbsp;</span><span class="value">' + scorep1 + '</span>';
	getId('gameScore2').innerHTML = '<span class="label '+ p2w +'">Player 2 Score&nbsp;</span><span class="value">' + scorep2 + '</span>';
	getId('maxChain').innerHTML = '<span class="label">Best Chain&nbsp;</span><span class="value">' + best_chain + '</span>';
	
    show(getId('gameOver'));
  };
  
  // triggered when quit game is selected from the pause menu
  // a domAlert() will display asking if the player really wants to quit
  getId('quitGame').onclick = function() {
    getId('confirmQuit').onclick = function() { gameOver(), hide(getId('popup')) }
  };
  
  // few helpers for coordinates and the ball direction
  function ballDir(d) { return new RegExp(d).test(ball.el.className) };
  function getX(el) { return Number(el.style.left.replace(/(%|px)/,'')) };
  function getY(el) { return Number(el.style.top.replace(/(%|px)/,'')) };
  function sX() { return Number(ball.el.className.replace(/.*?_X(\d+).*/,'$1')) }
  function sY() { return Number(ball.el.className.replace(/.*?_Y(\d+)/,'$1')) }
};

var online = {
  room : null,
  side : '',
  elements : null,
  keys : { up:false, down:false, turbo:false },
  lastSent : { up:false, down:false, turbo:false },
  lastState : null,
  lastEventSeq : 0,
  gameOverShown : false,
  requestId : 0,
  busy : false
};

function startOnline(type) {
  if (online.busy) return;
  var requestId = ++online.requestId;

  if (online.room) {
    online.room.leave();
    online.room = null;
  }

  setOnlineBusy(true);
  onlineStatus('Connecting...');

  if (location.protocol == 'file:' || !window.Colyseus) {
    onlineStatus('Online needs the Node server. Run npm run dev and open http://127.0.0.1:2567/');
    setOnlineBusy(false);
    showOnlineBack();
    return;
  }

  var client = new Colyseus.Client(onlineEndpoint()), request;

  if (type == 'quick') request = client.joinOrCreate('pong', { mode:'quick' });
  if (type == 'create') request = client.create('pong', { private:true });
  if (type == 'join') {
    var roomCode = getId('roomCode').value.replace(/\s/g, '');
    if (!roomCode) {
      onlineStatus('Type a Room Code first.');
      setOnlineBusy(false);
      showOnlineBack();
      return;
    }
    request = client.joinById(roomCode);
  }

  hideOnlineBack();
  showOnlineCancel();

  request.then(function(room) {
    if (requestId != online.requestId) {
      room.leave();
      return;
    }
    setupOnlineRoom(room, requestId);
  }).catch(function(error) {
    if (requestId != online.requestId) return;
    onlineStatus('Connection failed : ' + (error.message || error));
    setOnlineBusy(false);
    hideOnlineCancel();
    showOnlineBack();
  });
};

function cancelOnline() {
  var room = online.room;

  online.requestId += 1;
  online.keys = { up:false, down:false, turbo:false };
  online.lastSent = { up:false, down:false, turbo:false };
  online.room = null;
  online.side = '';
  online.lastState = null;
  online.lastEventSeq = 0;
  online.gameOverShown = false;
  started = false;

  if (room) room.leave();

  removeOnlineElements();
  document.onkeydown = null;
  document.onkeyup = null;
  hide(getId('UI'));
  show(getId('main-info'));
  setOnlineBusy(false);
  hideOnlineCancel();
  showOnlineBack();
  onlineStatus('Matchmaking cancelled.');
};

function setupOnlineRoom(room, requestId) {
  online.room = room;
  online.side = '';
  online.keys = { up:false, down:false, turbo:false };
  online.lastSent = { up:false, down:false, turbo:false };
  online.lastState = null;
  online.lastEventSeq = 0;
  online.gameOverShown = false;

  getId('roomCode').value = room.roomId;
  onlineStatus('Room Code : ' + room.roomId + '<br/>Waiting for seat...');

  room.onMessage('joined', function(message) {
    if (!isCurrentOnlineRoom(room, requestId)) return;
    online.side = message.side;
    started = true;
    hide(getId('main-info'));
    show(getId('UI'));
    createOnlineElements();
    bindOnlineControls();
    onlineStatus('Room Code : ' + message.roomId + '<br/>You are Player ' + (online.side == 'left' ? '1' : '2') + '. Waiting for opponent...');
  });

  room.onMessage('state', function(state) {
    if (!isCurrentOnlineRoom(room, requestId)) return;
    renderOnlineState(state);
  });

  room.onMessage('error', function(message) {
    if (!isCurrentOnlineRoom(room, requestId)) return;
    onlineStatus(message.message || 'Server error.');
  });

  room.onLeave(function() {
    if (!isCurrentOnlineRoom(room, requestId)) return;
    online.room = null;
    setOnlineBusy(false);
    hideOnlineCancel();
    if (!online.gameOverShown) {
      onlineStatus('Disconnected.');
      showOnlineBack();
    }
  });
};

function renderOnlineState(state) {
  online.lastState = state;
  createOnlineElements();

  if (state.phase == 'playing') {
    hideMenus();
  } else if (state.phase == 'waiting') {
    show(getId('online'));
    onlineStatus('Room Code : ' + state.roomId + '<br/>' + state.message);
  }

  moveOnlineSprite(online.elements.left, state.paddles.left.x, state.paddles.left.y, state.paddles.left.width, state.paddles.left.height);
  moveOnlineSprite(online.elements.right, state.paddles.right.x, state.paddles.right.y, state.paddles.right.width, state.paddles.right.height);
  moveOnlineSprite(online.elements.ball, state.ball.x, state.ball.y, state.ball.size, state.ball.size);
  syncOnlineUI(state);
  playOnlineEvent(state);

  if (state.phase == 'ended') showOnlineGameOver(state);
};

function createOnlineElements() {
  if (online.elements) return;

  var left = document.createElement('IMG'),
      right = document.createElement('IMG'),
      ball = document.createElement('IMG');

  left.src = custom.paddle;
  right.src = custom.paddle;
  ball.src = custom.ball;

  if (custom.color != 'none') {
    left.style.background = custom.color;
    right.style.background = custom.color;
    ball.style.background = custom.color;
  }

  left.className = 'paddle p1';
  right.className = 'paddle p2';
  ball.className = custom.id == 'customBall' ? 'customBall' : 'ball';

  document.body.insertBefore(ball, document.body.firstChild);
  document.body.insertBefore(right, document.body.firstChild);
  document.body.insertBefore(left, document.body.firstChild);

  online.elements = {
    left : left,
    right : right,
    ball : ball
  };
};

function removeOnlineElements() {
  if (!online.elements) return;

  var elements = [online.elements.left, online.elements.right, online.elements.ball];
  for (var i=0; i<elements.length; i++) {
    if (elements[i] && elements[i].parentNode) elements[i].parentNode.removeChild(elements[i]);
  }
  online.elements = null;
};

function bindOnlineControls() {
  document.onkeydown = function(e) {
    if (onlineKey(e, true)) e.preventDefault();
  };

  document.onkeyup = function(e) {
    if (onlineKey(e, false)) e.preventDefault();
  };
};

function onlineKey(e, down) {
  var key = e.key ? e.key.toLowerCase().replace(/arrow/, '') : e.which || e.keyCode,
      handled = false;

  if (key == 'up' || key == 'w' || key == 38 || key == 87) {
    online.keys.up = down;
    handled = true;
  }
  if (key == 'down' || key == 's' || key == 40 || key == 83) {
    online.keys.down = down;
    handled = true;
  }
  if (key == 'shift' || key == 16) {
    online.keys.turbo = down;
    handled = true;
  }

  if (handled) sendOnlineInput();
  return handled;
};

function sendOnlineInput(force) {
  if (!online.room) return;
  if (!force && online.keys.up == online.lastSent.up && online.keys.down == online.lastSent.down && online.keys.turbo == online.lastSent.turbo) return;

  online.lastSent = {
    up : online.keys.up,
    down : online.keys.down,
    turbo : online.keys.turbo
  };
  online.room.send('input', online.lastSent);
};

function resetOnlineInput(force) {
  online.keys = { up:false, down:false, turbo:false };
  sendOnlineInput(force);
};

function moveOnlineSprite(el, x, y, w, h) {
  var sx = window.innerWidth / 900,
      sy = window.innerHeight / 550;

  el.style.left = Math.floor(x * sx) + 'px';
  el.style.top = Math.floor(y * sy) + 'px';
  el.style.width = Math.max(3, Math.floor(w * sx)) + 'px';
  el.style.height = Math.max(3, Math.floor(h * sy)) + 'px';
};

function syncOnlineUI(state) {
  getId('p1').innerHTML = state.scores.left;
  getId('p2').innerHTML = state.scores.right;
  getId('chain').innerHTML = state.chain;
  getId('bestChain').innerHTML = state.bestChain;

  var chainLevel = 'zeroChain';
  if (state.chain >= 1) chainLevel = 'goodChain';
  if (state.chain >= 25) chainLevel = 'greatChain';
  if (state.chain >= 50) chainLevel = 'superChain';
  getId('chain').className = chainLevel;
};

function playOnlineEvent(state) {
  if (!state.event || state.eventSeq == online.lastEventSeq) return;
  online.lastEventSeq = state.eventSeq;

  if (state.event == 'hit') sfx('hitfx');
  if (state.event == 'wall') sfx('collfx');
  if (state.event == 'goal' || state.event == 'gameover') sfx('goalfx');
};

function showOnlineGameOver(state) {
  if (online.gameOverShown) return;
  online.gameOverShown = true;
  setOnlineBusy(false);
  hideOnlineCancel();

  if (state.message == 'Opponent left') {
    domAlert('Online Multiplayer', 'Opponent left', '<div class="button" onclick="window.location.reload()">Back to main menu</div>');
    return;
  }

  var winner = 'Draw !';
  if (state.winner == online.side) winner = 'You won !';
  else if (state.winner) winner = 'Opponent won !';

  getId('gameWinner').innerHTML = winner;
  getId('gameType').innerHTML = '<span class="label">Game Type&nbsp;</span><span class="value">Online Multiplayer</span>';
  getId('gameMode').innerHTML = '<span class="label">Room&nbsp;</span><span class="value">' + state.roomId + '</span>';
  getId('gameScore1').innerHTML = '<span class="label">Player 1 Score&nbsp;</span><span class="value">' + state.scores.left + '</span>';
  getId('gameScore2').innerHTML = '<span class="label">Player 2 Score&nbsp;</span><span class="value">' + state.scores.right + '</span>';
  getId('maxChain').innerHTML = '<span class="label">Best Chain&nbsp;</span><span class="value">' + state.bestChain + '</span>';

  show(getId('gameOver'));
};

function onlineStatus(message) {
  getId('onlineStatus').innerHTML = message;
};

function hideOnlineBack() {
  if (getId('onlineBack')) hide(getId('onlineBack'));
};

function showOnlineBack() {
  if (getId('onlineBack')) show(getId('onlineBack'));
};

function hideOnlineCancel() {
  if (getId('onlineCancel')) hide(getId('onlineCancel'));
};

function showOnlineCancel() {
  if (getId('onlineCancel')) show(getId('onlineCancel'));
};

function setOnlineBusy(busy) {
  online.busy = busy;
  for (var i=0, ids=['onlineQuick','onlineCreate','onlineJoin']; i<ids.length; i++) {
    var action = getId(ids[i]);
    if (!action) continue;
    action.style.pointerEvents = busy ? 'none' : '';
    action.className = busy ? addClass(action.className, 'disabled') : removeClass(action.className, 'disabled');
  }
};

function isCurrentOnlineRoom(room, requestId) {
  return online.room == room && online.requestId == requestId;
};

function addClass(className, name) {
  return new RegExp('(^|\\s)' + name + '(\\s|$)').test(className) ? className : className + ' ' + name;
};

function removeClass(className, name) {
  return className.replace(new RegExp('(^|\\s)' + name + '(\\s|$)', 'g'), ' ').replace(/^\s+|\s+$/g, '');
};

function onlineEndpoint() {
  return (location.protocol == 'https:' ? 'wss://' : 'ws://') + location.host + onlineBasePath(location.pathname);
};

function onlineBasePath(pathname) {
  pathname = pathname || '/';
  if (pathname == '/') return '';

  if (pathname.charAt(pathname.length - 1) == '/') {
    pathname = pathname.slice(0, -1);
  } else if (/\.[^\/]+$/.test(pathname)) {
    pathname = pathname.replace(/\/[^\/]*$/, '');
  }

  return pathname == '/' ? '' : pathname;
};

function hideMenus() {
  for (var i=0, menus=document.getElementsByTagName('DIV'); i<menus.length; i++) if (/menu/.test(menus[i].className)) hide(menus[i]);
};

window.addEventListener('resize', function() {
  if (online.lastState) renderOnlineState(online.lastState);
});

window.addEventListener('blur', function() {
  resetOnlineInput();
});

if (document.addEventListener) {
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) resetOnlineInput();
  });
}

window.addEventListener('beforeunload', function() {
  if (online.room) online.room.leave();
});


// pauses the game and shows the pause menu
function pause() {
  paused = true;
  show(getId('pause'));
};

// resumes the game and hits menus that may have been open
function resume() {
  paused = false;
  hide(getId('pause'), getId('customize'), getId('instructions'), getId('about'), getId('popup'));
};

// this updates the graphics of the game
// it's triggered from the customization menu presets
function setPreset(paddle, ball, id, color) {
  custom.paddle = paddle;
  custom.ball = ball;
  custom.id = id;
  custom.color = color;
  
  updatePreview(paddle, ball, color, id);
};

// set custom graphics and colors
function setCustom() {
  var paddle = getId('p_graphic').value, paddle = paddle.length > 0 ? paddle:'graphics/p_alpha.gif',
  ball = getId('b_graphic').value, ball = ball.length > 0 ? ball:'graphics/b_alpha.gif',
  color = getId('o_color').value, color = color.length > 0 ? color:'none',
  id = getId('b_spin').checked ? 'customBall':'ball';
  
  custom.paddle = paddle;
  custom.ball = ball;
  custom.id = id;
  custom.color = color;
  
  updatePreview(paddle, ball, color, id);
};

// updates the preview under customization
function updatePreview(paddle, ball, color, id) {
  var b = getId('ballP');
  b.src = ball, b.style.background = color, b.className = id;
  
  for (var i=0, img=document.getElementsByTagName('IMG'); i<img.length; i++) {
	if (/paddle/.test(img[i].className)) img[i].src = paddle, img[i].style.background = color;
	if (img[i].id == 'ball' || img[i].id == 'customBall') img[i].src = ball, img[i].style.background = color, img[i].id = id;
  }
};

// custom alert so we don't have to use those ugly browser alerts
// the args are pretty self explanatory
// the popup itself can be found in index.html just above this script
function domAlert(title, message, custom) {
  var OK = getId('OK'), cAlert = getId('customAlert');

  getId('popupTitle').innerHTML = title;
  getId('popupContent').innerHTML = message;
  if (custom) {
    hide(OK), show(cAlert);
    cAlert.innerHTML = custom;
  } else show(OK), hide(cAlert);
  
  show(getId('popup'));
};

function sfx(audio) {
  var sound = getId(audio);
  if (!sound) return;
  var played = sound.play();
  if (played && played.catch) played.catch(function() {});
};
function getId(id) { return document.getElementById(id) };
function show() { for (var i=0,args=arguments; i<args.length; i++) args[i].style.display = '' };
function hide() { for (var i=0,args=arguments; i<args.length; i++) args[i].style.display = 'none' };
function modeType() { return Number(getId('modeList').className.replace(/mode_(\d+)/,'$1')) };
function cNum(id, def) { return Number(getId(id).value) > 0 ? Number(getId(id).value):def }
