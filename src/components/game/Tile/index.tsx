"use client";
import React from 'react';
import type { Tile as TileType } from '@/types/game';
import { motion } from 'framer-motion';

interface TileProps {
  tile: TileType;
  size?: number; // pixels
}

export default function Tile({ tile, size = 32 }: TileProps) {
  const letter = tile.letter ?? '';
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      aria-label={`Tile ${letter || 'blank'} worth ${tile.points} points`}
      role="img"
      className="select-none grid place-items-center rounded-md bg-amber-200 text-black font-bold shadow-sm border border-black/10 dark:border-white/10"
      style={{ width: size, height: size }}
    >
      <span className="relative">
        {letter}
        {tile.points > 0 && (
          <span className="absolute -bottom-2 -right-2 text-[10px] font-medium opacity-80">
            {tile.points}
          </span>
        )}
      </span>
    </motion.div>
  );
}
