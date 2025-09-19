"use client";
import React from 'react';
import { motion } from 'framer-motion';
import type { Tile as TileType } from '@/types/game';

export function Tile({ tile }: { tile: TileType }) {
  return (
    <motion.div
      className="w-8 h-8 bg-amber-200 text-black rounded flex items-center justify-center shadow"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <span className="text-sm font-bold">
        {tile.letter}
      </span>
      <span className="text-[10px] ml-1 opacity-80">{tile.points}</span>
    </motion.div>
  );
}

export default Tile;
