export const BOARD_SIZE = 15 as const;

export type Letter =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
  | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';

export interface Tile {
  letter: Letter | null;
  points: number;
  isBlank: boolean;
}

export interface BoardCell {
  tile: Tile | null;
  premium?: 'DL' | 'TL' | 'DW' | 'TW' | 'CENTER';
  locked?: boolean; // Tile from previous turns
}

export type BoardGrid = BoardCell[][]; // 15 x 15 logical

export type Direction = 'H' | 'V';
export interface Position { row: number; col: number }

export interface BoardState {
  grid: (Tile | null)[][];
  selectedSquare: Position | null;
  direction: Direction;
  validPlacements: Position[];
  lastMove: Move | null;
}

export interface PlayerState {
  id: string;
  name: string;
  score: number;
  rack: Tile[];
  isConnected: boolean;
}

export type GameStatus = 'waiting' | 'active' | 'paused' | 'finished';

export interface PlacedTile {
  row: number; // 0..14
  col: number; // 0..14
  tile: Tile;
}

export interface Move {
  playerId: string;
  tiles: PlacedTile[];
  formedWords: string[];
  totalPoints: number;
}

export interface MoveValidationResult {
  isValid: boolean;
  reason?: string;
  score?: number;
  words?: string[];
}

export interface GameState {
  id: string;
  board: BoardGrid;
  players: PlayerState[];
  currentTurnPlayerId: string | null;
  bagCount: number;
  status: GameStatus;
  lastMove?: Move;
}

// Server-synchronized timer state
export interface TimerState {
  player1Time: number;
  player2Time: number;
  currentPlayer: 'player1' | 'player2';
  isPaused: boolean;
}

export interface ValidationWarning {
  type: 'INVALID_TURN' | 'INVALID_TILE' | 'OFF_BOARD' | 'NO_START' | 'NOT_CONNECTED';
  message: string;
  severity: 'error' | 'warning';
  position?: Position;
}

export interface InputHandler {
  onLetterPress: (letter: string, isBlank: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onExchange: () => void;
  validatePlacement: (position: Position, letter: string) => boolean;
  getNextPosition: (current: Position, direction: Direction) => Position;
}

export interface LobbyRoom {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
  status: 'open' | 'in-game' | 'full';
}
