"use client";
import { useEffect } from 'react';
import { useSocketContext } from '@/services/socket-context';
import type { ServerToClientEvents } from '@/types/ws';

export function useSocket<E extends keyof ServerToClientEvents>(
  event: E,
  handler: ServerToClientEvents[E]
) {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;
    const s = socket as unknown as {
      on<K extends keyof ServerToClientEvents>(ev: K, fn: ServerToClientEvents[K]): void;
      off<K extends keyof ServerToClientEvents>(ev: K, fn: ServerToClientEvents[K]): void;
    };
    s.on(event, handler);
    return () => {
      s.off(event, handler);
    };
  }, [socket, event, handler]);
}
