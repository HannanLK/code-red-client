"use client";
import { useEffect } from 'react';
import { useSocketContext } from '@/services/socket-context';

export function useSocket<T extends string>(
  event: T,
  handler: (...args: any[]) => void
) {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;
    socket.on(event as any, handler as any);
    return () => {
      socket.off(event as any, handler as any);
    };
  }, [socket, event, handler]);
}
