import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { BoardCell, BoardGrid, GameState as GameStateType, Move, PlayerState, Position, Direction } from '@/types/game';
import { BOARD_SIZE } from '@/types/game';
import { computeValidPath, withPremiums } from '@/utils/board';

const createEmptyBoard = (): BoardGrid => {
  const grid: BoardGrid = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: BoardCell[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      row.push({ tile: null });
    }
    grid.push(row);
  }
  return withPremiums(grid);
};

interface BoardUIState {
  selectedSquare: Position | null;
  direction: Direction;
  validPlacements: Position[];
  zoom: number; // 0.6 .. 2.0
  ghostTiles: { position: Position; letter: string; isBlank?: boolean }[];
  warnings: { type: string; message: string; severity: 'error' | 'warning'; position?: Position }[];
  undoStack: { position: Position; letter: string; isBlank?: boolean }[];
  redoStack: { position: Position; letter: string; isBlank?: boolean }[];
}

interface GameSliceState {
  game: GameStateType;
  boardUI: BoardUIState;
}

// Local demo rack generator so the rack isn't empty before joining a game
const generateRandomRack = (count = 7) => {
  const letters = 'EEEEEEEEEEEEAAAAAAAAAIIIIIIIIIINNNNNNRRRRRRTTTTTTOOOOOOLLLSSSUUUDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ??';
  const pool = letters.split('');
  const pick = () => {
    const i = Math.floor(Math.random() * pool.length);
    return pool.splice(i, 1)[0];
  };
  const points: Record<string, number> = { E:1,A:1,I:1,O:1,N:1,R:1,T:1,L:1,S:1,U:1,D:2,G:2,B:3,C:3,M:3,P:3,F:4,H:4,V:4,W:4,Y:4,K:5,J:8,X:8,Q:10,Z:10,'?':0 };
  const tiles: GameStateType['players'][number]['rack'] = [] as any;
  for (let i = 0; i < count; i++) {
    const ch = pick();
    const isBlank = ch === '?';
    tiles.push({ letter: isBlank ? null : (ch as any), points: points[ch], isBlank });
  }
  return tiles;
};

const initialState: GameSliceState = {
  game: {
    id: 'local-dev-game',
    board: createEmptyBoard(),
    players: [
      { id: 'p1', name: 'Player 1', score: 0, rack: generateRandomRack(), isConnected: true },
      { id: 'p2', name: 'Player 2', score: 0, rack: generateRandomRack(), isConnected: true },
    ],
    currentTurnPlayerId: 'p1',
    bagCount: 100,
    status: 'active',
  },
  boardUI: {
    selectedSquare: null,
    direction: 'H',
    validPlacements: [],
    zoom: 1,
    ghostTiles: [],
    warnings: [],
    undoStack: [],
    redoStack: [],
  },
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setGameState(state, action: PayloadAction<GameStateType>) {
      const incoming = action.payload;
      // Normalize incoming board from server (may be a 15x15 matrix of nulls)
      const normalizeBoard = (raw: unknown): BoardGrid => {
        const grid: BoardGrid = [];
        if (Array.isArray(raw)) {
          const rows = Math.max(BOARD_SIZE, (raw as unknown[]).length || BOARD_SIZE);
          for (let r = 0; r < rows && r < BOARD_SIZE; r++) {
            const rawRow = (raw as unknown[])[r];
            const row: BoardCell[] = [];
            if (Array.isArray(rawRow)) {
              for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = (rawRow as unknown[])[c] as any;
                if (cell && typeof cell === 'object' && 'tile' in cell) {
                  // Ensure locked boolean shape
                  row.push({ tile: (cell as any).tile ?? null, locked: !!(cell as any).locked, premium: (cell as any).premium });
                } else {
                  row.push({ tile: null });
                }
              }
            } else {
              for (let c = 0; c < BOARD_SIZE; c++) row.push({ tile: null });
            }
            grid.push(row);
          }
        }
        // If grid is empty, create default
        if (grid.length === 0) {
          for (let r = 0; r < BOARD_SIZE; r++) {
            const row: BoardCell[] = [];
            for (let c = 0; c < BOARD_SIZE; c++) row.push({ tile: null });
            grid.push(row);
          }
        }
        return withPremiums(grid);
      };
      // Merge players: preserve existing racks if server doesn't send them
      const prevPlayers = state.game.players || [];
      const incomingPlayers = Array.isArray(incoming.players) ? incoming.players : [];
      const mergedPlayers: PlayerState[] = incomingPlayers.length > 0
        ? incomingPlayers.map((p) => {
            const prev = prevPlayers.find(pp => pp.id === p.id);
            const rack = Array.isArray((p as any).rack) && (p as any).rack.length > 0
              ? (p as any).rack
              : (prev?.rack && prev.rack.length > 0 ? prev.rack : generateRandomRack());
            return { ...p, rack } as PlayerState;
          })
        : prevPlayers;
      state.game = {
        ...incoming,
        players: mergedPlayers,
        currentTurnPlayerId: incoming.currentTurnPlayerId ?? state.game.currentTurnPlayerId,
        board: normalizeBoard(incoming.board as unknown),
      } as GameStateType;
    },
    setPlayers(state, action: PayloadAction<PlayerState[]>) {
      state.game.players = action.payload;
    },
    shuffleRack(state, action: PayloadAction<string | undefined>) {
      const desiredId = action.payload ?? state.game.currentTurnPlayerId ?? (state.game.players[0]?.id ?? null);
      if (!desiredId) return;
      const player = state.game.players.find(p => p.id === desiredId);
      if (!player || !Array.isArray(player.rack)) return;
      const arr = [...player.rack];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      player.rack = arr;
    },
    applyMove(state, action: PayloadAction<Move>) {
      const move = action.payload;
      move.tiles.forEach(({ row, col, tile }) => {
        state.game.board[row][col] = { tile, locked: true };
      });
      state.game.lastMove = move;
      // clear temp
      state.boardUI.ghostTiles = [];
      state.boardUI.undoStack = [];
      state.boardUI.redoStack = [];
    },
    resetBoard(state) {
      state.game.board = createEmptyBoard();
      state.boardUI.selectedSquare = null;
      state.boardUI.validPlacements = [];
      state.boardUI.ghostTiles = [];
      state.boardUI.undoStack = [];
      state.boardUI.redoStack = [];
      state.boardUI.warnings = [];
    },
    selectSquare(state, action: PayloadAction<Position>) {
      const pos = action.payload;
      const same = state.boardUI.selectedSquare && state.boardUI.selectedSquare.row === pos.row && state.boardUI.selectedSquare.col === pos.col;
      if (same) {
        // toggle direction
        state.boardUI.direction = state.boardUI.direction === 'H' ? 'V' : 'H';
      } else {
        state.boardUI.selectedSquare = pos;
      }
      // recompute valid path from selected
      const start = state.boardUI.selectedSquare ?? pos;
      state.boardUI.validPlacements = computeValidPath(state.game.board, start, state.boardUI.direction);
    },
    toggleDirection(state) {
      state.boardUI.direction = state.boardUI.direction === 'H' ? 'V' : 'H';
      if (state.boardUI.selectedSquare) {
        state.boardUI.validPlacements = computeValidPath(state.game.board, state.boardUI.selectedSquare, state.boardUI.direction);
      }
    },
    setZoom(state, action: PayloadAction<number>) {
      const z = Math.max(0.6, Math.min(2, action.payload));
      state.boardUI.zoom = z;
    },
    clearSelection(state) {
      state.boardUI.selectedSquare = null;
      state.boardUI.validPlacements = [];
      state.boardUI.ghostTiles = [];
      state.boardUI.undoStack = [];
      state.boardUI.redoStack = [];
      state.boardUI.warnings = [];
    },
    placeGhostTile(state, action: PayloadAction<{ position: Position; letter: string; isBlank?: boolean }>) {
      const { position, letter, isBlank } = action.payload;
      // ensure position is in validPlacements
      const ok = state.boardUI.validPlacements.some(p => p.row === position.row && p.col === position.col);
      if (!ok) return;
      state.boardUI.ghostTiles.push({ position, letter, isBlank });
      state.boardUI.undoStack.push({ position, letter, isBlank });
      state.boardUI.redoStack = [];
      // advance selection
      const dir = state.boardUI.direction;
      const next = dir === 'H' ? { row: position.row, col: position.col + 1 } : { row: position.row + 1, col: position.col };
      state.boardUI.selectedSquare = next;
      state.boardUI.validPlacements = computeValidPath(state.game.board, next, dir);
    },
    removeLastGhostTile(state) {
      const last = state.boardUI.undoStack.pop();
      if (!last) return;
      // remove from ghostTiles matching position
      const idx = state.boardUI.ghostTiles.findIndex(g => g.position.row === last.position.row && g.position.col === last.position.col);
      if (idx >= 0) state.boardUI.ghostTiles.splice(idx, 1);
      // Set selection back to last position
      state.boardUI.selectedSquare = last.position;
      state.boardUI.validPlacements = computeValidPath(state.game.board, last.position, state.boardUI.direction);
      state.boardUI.redoStack.push(last);
    },
    redoGhostTile(state) {
      const redo = state.boardUI.redoStack.pop();
      if (!redo) return;
      state.boardUI.ghostTiles.push({ ...redo });
      state.boardUI.undoStack.push(redo);
      const dir = state.boardUI.direction;
      const next = dir === 'H' ? { row: redo.position.row, col: redo.position.col + 1 } : { row: redo.position.row + 1, col: redo.position.col };
      state.boardUI.selectedSquare = next;
      state.boardUI.validPlacements = computeValidPath(state.game.board, next, dir);
    },
    clearGhostTiles(state) {
      state.boardUI.ghostTiles = [];
      state.boardUI.undoStack = [];
      state.boardUI.redoStack = [];
    },
    setWarnings(state, action: PayloadAction<BoardUIState['warnings']>) {
      state.boardUI.warnings = action.payload;
    },
  },
});

export const { setGameState, setPlayers, shuffleRack, applyMove, resetBoard, selectSquare, toggleDirection, setZoom, clearSelection, placeGhostTile, removeLastGhostTile, redoGhostTile, clearGhostTiles, setWarnings } = gameSlice.actions;
export default gameSlice.reducer;
