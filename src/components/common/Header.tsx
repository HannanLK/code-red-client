"use client";
import React from 'react';
import { Button } from '@/components/common/ui/button';

export function Header() {
  return (
    <header className="w-full py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold">Code-Red Scrabble</h1>
      <div className="flex items-center gap-2">
        <Button variant="outline">Rules</Button>
        <Button>New Game</Button>
      </div>
    </header>
  );
}

export default Header;
