"use client";
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { joinRoom, leaveRoom, setRooms, setStatus } from '@/features/lobby/lobbySlice';
import type { LobbyRoom } from '@/types/game';

export function useLobby() {
  const dispatch = useAppDispatch();
  const lobby = useAppSelector((s) => s.lobby);

  const updateRooms = useCallback((rooms: LobbyRoom[]) => {
    dispatch(setRooms(rooms));
  }, [dispatch]);

  const doJoin = useCallback((roomId: string) => {
    dispatch(joinRoom(roomId));
  }, [dispatch]);

  const doLeave = useCallback(() => {
    dispatch(leaveRoom());
  }, [dispatch]);

  const setLobbyStatus = useCallback((s: 'idle' | 'loading' | 'error') => {
    dispatch(setStatus(s));
  }, [dispatch]);

  return { lobby, updateRooms, doJoin, doLeave, setLobbyStatus } as const;
}
