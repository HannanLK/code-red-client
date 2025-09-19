"use client";
import React, { useEffect } from 'react';
import { useLobby } from '@/hooks/useLobby';
import { Button } from '@/components/common/ui/button';
import { Card, CardContent } from '@/components/common/ui/card';
import { useSocketContext } from '@/services/socket-context';
import { useSocket } from '@/hooks/useSocket';
import type { LobbyRoom } from '@/types/game';

export function Lobby() {
  const { lobby, updateRooms, doJoin } = useLobby();
  const { socket } = useSocketContext();

  // Request lobby rooms on mount
  useEffect(() => {
    if (!socket) return;
    socket.emit('lobby:list');
  }, [socket]);

  // Listen for lobby list updates
  useSocket('lobby:list', (rooms: LobbyRoom[]) => {
    updateRooms(rooms);
  });

  const joinRoom = (roomId: string) => {
    if (!socket) return;
    socket.emit('lobby:join', roomId);
    // Also emit join-game to bind game state and timer events
    socket.emit('join-game', roomId);
    doJoin(roomId);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <h3 className="text-lg font-semibold">Lobby</h3>
        <ul className="space-y-2">
          {lobby.rooms.map((room) => (
            <li key={room.id} className="flex items-center justify-between">
              <span>{room.name} · {room.players}/{room.maxPlayers} · {room.status}</span>
              <Button onClick={() => joinRoom(room.id)} disabled={room.status !== 'open'}>
                Join
              </Button>
            </li>
          ))}
          {lobby.rooms.length === 0 && (
            <li className="text-sm opacity-60">No rooms available</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

export default Lobby;
