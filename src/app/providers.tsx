"use client";
import React from 'react';
import { Provider as ReduxProvider, useSelector } from 'react-redux';
import { store, RootState } from '@/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { SocketProvider } from '@/services/socket-context';
import { useGameConnection } from '@/hooks/useGameConnection';

function ConnectedSocketProvider({ children }: { children: React.ReactNode }) {
  const token = useSelector((s: RootState) => s.auth.token);
  return <SocketProvider token={token}>{children}</SocketProvider>;
}

function GameSocketBridge() {
  // Bridges the Redux game id with the socket connection to ensure join-game is emitted
  useGameConnection();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <DndProvider backend={HTML5Backend}>
          <ConnectedSocketProvider>
            <GameSocketBridge />
            {children}
          </ConnectedSocketProvider>
        </DndProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
