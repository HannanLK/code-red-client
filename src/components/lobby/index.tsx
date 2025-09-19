"use client";
import React from 'react';
import { useLobby } from '@/hooks/useLobby';
import { Button } from '@/components/common/ui/button';
import { Card, CardContent } from '@/components/common/ui/card';

export function Lobby() {
  const { lobby, doJoin } = useLobby();
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <h3 className="text-lg font-semibold">Lobby</h3>
        <ul className="space-y-2">
          {lobby.rooms.map((room) => (
            <li key={room.id} className="flex items-center justify-between">
              <span>{room.name} · {room.players}/{room.maxPlayers} · {room.status}</span>
              <Button onClick={() => doJoin(room.id)} disabled={room.status !== 'open'}>
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
