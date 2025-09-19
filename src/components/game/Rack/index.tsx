"use client";
import React from 'react';
import { useAppSelector } from '@/store';
import Tile from '@/components/game/Tile';
import { Card, CardContent } from '@/components/common/ui/card';

export function Rack() {
  const me = useAppSelector((s) => s.game.game.players[0]);

  return (
    <Card>
      <CardContent className="p-3 flex gap-2">
        {me?.rack?.map((t, idx) => (
          <Tile key={idx} tile={t} />
        )) || <span className="opacity-60 text-sm">Empty rack</span>}
      </CardContent>
    </Card>
  );
}

export default Rack;
