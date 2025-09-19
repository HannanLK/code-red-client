"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/common/ui/card';
import { useAppSelector } from '@/store';
import { BOARD_SIZE } from '@/types/game';

export function Board() {
  const board = useAppSelector((s) => s.game.game.board);
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-2">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 2rem)` }}>
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => (
              <motion.div
                key={`${rIdx}-${cIdx}`}
                className="w-8 h-8 border border-black/10 dark:border-white/10 flex items-center justify-center text-sm"
                whileHover={{ scale: cell.tile ? 1.05 : 1 }}
              >
                {cell.tile?.letter ?? ''}
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default Board;
