"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { socketManager } from './socket';
import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/ws';

interface SocketContextValue {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

export const useSocketContext = () => useContext(SocketContext);

export function SocketProvider({ token, children }: { token?: string | null; children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    const s = socketManager.connect(token ?? undefined);
    setSocket(s);
    return () => {
      socketManager.disconnect();
      setSocket(null);
    };
  }, [token]);

  const value = useMemo(() => ({ socket }), [socket]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
