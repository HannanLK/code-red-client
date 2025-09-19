import type { GameState, LobbyRoom, Move, MoveValidationResult, PlayerState, TimerState } from './game';

export type ClientToServerEvents = {
  'auth:login': (token: string) => void;
  'lobby:list': () => void;
  'lobby:join': (roomId: string) => void;
  'lobby:leave': (roomId: string) => void;
  'game:start': (roomId: string) => void;
  'game:placeTiles': (move: Move) => void;
  'game:pass': () => void;
  'game:exchange': (letters: string[]) => void;
  'ping': () => void;
  // Spec-required aliases
  'join-game': (gameId: string) => void;
  'make-move': (move: Move) => void;
  'exchange-tiles': (tiles: string[]) => void;
  'pass-turn': () => void;
  'send-message': (message: string) => void;
};

export type ServerToClientEvents = {
  'auth:ok': (player: PlayerState) => void;
  'auth:error': (message: string) => void;
  'lobby:list': (rooms: LobbyRoom[]) => void;
  'lobby:joined': (room: LobbyRoom) => void;
  'lobby:left': (roomId: string) => void;
  'game:state': (state: GameState) => void;
  'game:moveValidated': (result: MoveValidationResult) => void;
  'game:playerJoined': (player: PlayerState) => void;
  'game:playerLeft': (playerId: string) => void;
  'disconnectReason': (reason: string) => void;
  'pong': () => void;
  // Timer
  'timer-sync': (times: TimerState) => void;
  'timer-expired': (player: string) => void;
  // Spec-required aliases
  'move-made': (move: Move) => void;
  'turn-changed': (playerId: string) => void;
  'tiles-received': (tiles: import('./game').Tile[]) => void;
  'game-ended': (result: unknown) => void;
  'player-disconnected': (playerId: string) => void;
  'player-reconnected': (playerId: string) => void;
};

export type WsEvent = keyof (ClientToServerEvents & ServerToClientEvents);
