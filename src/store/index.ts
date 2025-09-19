import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authReducer from '@/features/auth/authSlice';
import gameReducer from '@/features/game/gameSlice';
import lobbyReducer from '@/features/lobby/lobbySlice';
import chatReducer from '@/features/chat/chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    game: gameReducer,
    lobby: lobbyReducer,
    chat: chatReducer,
  },
  middleware: (getDefault) => getDefault({
    serializableCheck: false,
  }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
