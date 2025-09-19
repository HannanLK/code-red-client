"use client";
import React from 'react';
import { useAppSelector } from '@/store';
import { Card, CardContent } from '@/components/common/ui/card';

export function ScoreBoard() {
  const players = useAppSelector((s) => s.game.game.players);
  return (
    <Card>
      <CardContent className="p-3">
        <h3 className="font-semibold mb-2">Scores</h3>
        <ul className="space-y-1">
          {players.map((p) => (
            <li key={p.id} className="flex items-center justify-between">
              <span className="truncate">{p.name}</span>
              <span className="font-mono">{p.score}</span>
            </li>
          ))}
          {players.length === 0 && (
            <li className="text-sm opacity-60">No players yet</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

export default ScoreBoard;
