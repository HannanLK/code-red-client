import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { LobbyRoom } from '@/types/game';

interface LobbyState {
  rooms: LobbyRoom[];
  currentRoomId: string | null;
  status: 'idle' | 'loading' | 'error';
  error?: string;
}

const initialState: LobbyState = {
  rooms: [],
  currentRoomId: null,
  status: 'idle',
};

const lobbySlice = createSlice({
  name: 'lobby',
  initialState,
  reducers: {
    setRooms(state, action: PayloadAction<LobbyRoom[]>) {
      state.rooms = action.payload;
    },
    joinRoom(state, action: PayloadAction<string>) {
      state.currentRoomId = action.payload;
    },
    leaveRoom(state) {
      state.currentRoomId = null;
    },
    setStatus(state, action: PayloadAction<LobbyState['status']>) {
      state.status = action.payload;
    },
    setError(state, action: PayloadAction<string | undefined>) {
      state.error = action.payload;
      if (action.payload) state.status = 'error';
    },
  },
});

export const { setRooms, joinRoom, leaveRoom, setStatus, setError } = lobbySlice.actions;
export default lobbySlice.reducer;
