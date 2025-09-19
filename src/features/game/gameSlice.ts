import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { BoardCell, BoardGrid, GameState as GameStateType, Move, PlayerState } from '@/types/game';
import { BOARD_SIZE } from '@/types/game';

const createEmptyBoard = (): BoardGrid => {
  const grid: BoardGrid = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: BoardCell[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      row.push({ tile: null });
    }
    grid.push(row);
  }
  return grid;
};

interface GameSliceState {
  game: GameStateType;
}

const initialState: GameSliceState = {
  game: {
    id: '',
    board: createEmptyBoard(),
    players: [],
    currentTurnPlayerId: null,
    bagCount: 100,
    status: 'waiting',
  },
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setGameState(state, action: PayloadAction<GameStateType>) {
      state.game = action.payload;
    },
    setPlayers(state, action: PayloadAction<PlayerState[]>) {
      state.game.players = action.payload;
    },
    applyMove(state, action: PayloadAction<Move>) {
      const move = action.payload;
      move.tiles.forEach(({ row, col, tile }) => {
        state.game.board[row][col] = { tile, locked: true };
      });
      state.game.lastMove = move;
    },
    resetBoard(state) {
      state.game.board = createEmptyBoard();
    },
  },
});

export const { setGameState, setPlayers, applyMove, resetBoard } = gameSlice.actions;
export default gameSlice.reducer;
