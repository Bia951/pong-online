const { Room } = require('@colyseus/core');
const {
  addPlayer,
  createGameState,
  playerCount,
  removePlayer,
  serializeState,
  setInput,
  sideForSession,
  stepGame
} = require('./physics');

class PongRoom extends Room {
  onCreate(options) {
    this.maxClients = 2;
    this.patchRate = 50;
    this.maxMessagesPerSecond = 40;
    this.game = createGameState();
    this.game.roomId = this.roomId;
    this.broadcastElapsed = 0;
    this.disconnectTimer = null;

    if (options && options.private) {
      this.setPrivate(true).catch(function(error) {
        console.error('Failed to mark room private:', error);
      });
    }

    this.setMetadata({
      private: Boolean(options && options.private),
      phase: this.game.phase
    }).catch(function(error) {
      console.error('Failed to set room metadata:', error);
    });

    this.onMessage('input', (client, message) => {
      if (!sideForSession(this.game, client.sessionId)) return;
      setInput(this.game, client.sessionId, message || {});
    });

    this.setSimulationInterval((deltaTime) => {
      stepGame(this.game, deltaTime / 1000);
      this.broadcastElapsed += deltaTime;

      if (this.broadcastElapsed >= 50) {
        this.broadcastState();
        this.broadcastElapsed = 0;
      }
    }, 1000 / 60);
  }

  onJoin(client) {
    if (this.disconnectTimer) {
      this.disconnectTimer.clear();
      this.disconnectTimer = null;
    }

    var side = addPlayer(this.game, client.sessionId);
    if (!side) {
      client.send('error', { message: 'Room is full' });
      client.leave();
      return;
    }

    client.send('joined', {
      side: side,
      roomId: this.roomId
    });

    if (playerCount(this.game) === 2) {
      this.lock().catch(function(error) {
        console.error('Failed to lock full room:', error);
      });
    }

    this.updateMatchmaking();
    this.broadcastState();
  }

  onLeave(client) {
    removePlayer(this.game, client.sessionId);
    this.lock().catch(function(error) {
      console.error('Failed to lock abandoned room:', error);
    });
    this.updateMatchmaking();
    this.broadcastState();

    if (playerCount(this.game) > 0) {
      this.disconnectTimer = this.clock.setTimeout(() => {
        this.disconnect();
      }, 5000);
    }
  }

  onDispose() {
    this.disconnectTimer = null;
  }

  broadcastState() {
    this.broadcast('state', serializeState(this.game));
  }

  updateMatchmaking() {
    this.setMetadata({
      private: Boolean(this.metadata && this.metadata.private),
      phase: this.game.phase
    }).catch(function(error) {
      console.error('Failed to update room metadata:', error);
    });
  }
}

module.exports = { PongRoom };
