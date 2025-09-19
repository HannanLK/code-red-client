import type { GameState, LobbyRoom, Move, MoveValidationResult, PlayerState } from './game';

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
};

export type WsEvent = keyof (ClientToServerEvents & ServerToClientEvents);
