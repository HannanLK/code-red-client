"use client";
import { useEffect, useCallback } from 'react';
import { useAppSelector } from '@/store';
import { useSocketContext } from '@/services/socket-context';
import { useSocket } from '@/hooks/useSocket';
import type { TimerState } from '@/types/game';

export function useGameConnection() {
  const { socket } = useSocketContext();
  const gameId = useAppSelector((s) => s.game.game.id);

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
}
