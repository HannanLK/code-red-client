"use client";
import React from 'react';
import { Button } from '@/components/common/ui/button';
import { useGame } from '@/hooks/useGame';
import type { PlayerState, GameState, Tile } from '@/types/game';

function generateRandomRack(count = 7): Tile[] {
  const letters = 'EEEEEEEEEEEEAAAAAAAAAIIIIIIIIIINNNNNNRRRRRRTTTTTTOOOOOOLLLSSSUUUDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ??';
  const pool = letters.split('');
  const pick = () => {
    const i = Math.floor(Math.random() * pool.length);
    return pool.splice(i, 1)[0];
  };
  const points: Record<string, number> = { E:1,A:1,I:1,O:1,N:1,R:1,T:1,L:1,S:1,U:1,D:2,G:2,B:3,C:3,M:3,P:3,F:4,H:4,V:4,W:4,Y:4,K:5,J:8,X:8,Q:10,Z:10,'?':0 };
  const tiles: Tile[] = [];
  for (let i = 0; i < count; i++) {
    const ch = pick();
    const isBlank = ch === '?';
    tiles.push({ letter: isBlank ? null : (ch as any), points: points[ch], isBlank });
  }
  return tiles;
}

export function Header() {
  const { updateGame, updatePlayers, clearBoard } = useGame();
  const [showRules, setShowRules] = React.useState(false);

  const onNewGame = () => {
    // Minimal local 2-player setup
    clearBoard();
    const players: PlayerState[] = [
      { id: 'p1', name: 'Player 1', score: 0, rack: generateRandomRack(), isConnected: true },
      { id: 'p2', name: 'Player 2', score: 0, rack: generateRandomRack(), isConnected: true },
    ];
    updatePlayers(players);
    const next: Partial<GameState> = {
      id: `local-${Date.now()}`,
      currentTurnPlayerId: 'p1',
      bagCount: 100,
      status: 'active',
    } as any;
    updateGame({ ...(next as GameState), board: (null as any) as never, players } as any);
  };

  return (
    <header className="w-full py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold">Code-Red Scrabble</h1>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setShowRules(true)}>Rules</Button>
        <Button onClick={onNewGame}>New Game</Button>
      </div>

      {showRules && (
        <div role="dialog" aria-modal className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white text-black dark:text-white dark:bg-neutral-900 max-w-lg w-full rounded shadow p-4 space-y-3">
            <h2 className="text-lg font-semibold">Rules (Quick Summary)</h2>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Place tiles to form valid words horizontally or vertically.</li>
              <li>The first word must cover the center tile.</li>
              <li>Words must connect to existing tiles.</li>
              <li>Premium squares multiply letter or word scores: DL, TL, DW, TW.</li>
              <li>Blanks (no points) can represent any letter.</li>
            </ul>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRules(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
