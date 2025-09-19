"use client";
import { useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { useSocketContext } from '@/services/socket-context';
import { useSocket } from '@/hooks/useSocket';
import type { TimerState, GameState as GameStateType } from '@/types/game';
import { setGameState } from '@/features/game/gameSlice';

export function useGameConnection() {
  const { socket } = useSocketContext();
  const gameId = useAppSelector((s) => s.game.game.id);
  const dispatch = useAppDispatch();

  const emitJoin = useCallback(() => {
    if (!socket || !gameId) return;
    try {
      socket.emit('join-game', gameId);
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[WS] join-game emitted', { gameId });
      }
    } catch (e) {
      console.warn('Failed to emit join-game', e);
    }
  }, [socket, gameId]);

  // Emit join when connected or when gameId changes
  useEffect(() => {
    if (!socket || !gameId) return;
    if (socket.connected) {
      emitJoin();
      return;
    }
    const onConnect = () => emitJoin();
    socket.on('connect', onConnect);
    return () => {
      socket.off('connect', onConnect);
    };
  }, [socket, gameId, emitJoin]);

  // Listen to timer events for verification
  useSocket('timer-sync', (times: TimerState) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[WS] timer-sync', times);
    }
  });

  useSocket('timer-expired', (player: string) => {
    console.warn('[WS] timer expired for', player);
  });

  // Bridge server game state events (supports both 'game-state' and 'game:state')
  useEffect(() => {
    if (!socket) return;
    const onGameState = (state: GameStateType) => {
      dispatch(setGameState(state));
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[WS] game-state received', state);
      }
    };
    // Attach both event name variants for compatibility
    // Note: 'game:state' is part of our typed map, but 'game-state' is not.
    // @ts-expect-error dynamic event name not in our typed map
    socket.on('game-state', onGameState);
    socket.on('game:state', onGameState);
    return () => {
      // @ts-expect-error dynamic event name not in our typed map
      socket.off('game-state', onGameState);
      socket.off('game:state', onGameState);
    };
  }, [socket, dispatch]);
}
