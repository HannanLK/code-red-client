"use client";
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { applyMove, resetBoard, setGameState, setPlayers } from '@/features/game/gameSlice';
import type { GameState, Move, PlayerState } from '@/types/game';

export function useGame() {
  const dispatch = useAppDispatch();
  const game = useAppSelector((s) => s.game.game);

  const updateGame = useCallback((g: GameState) => {
    dispatch(setGameState(g));
  }, [dispatch]);

  const updatePlayers = useCallback((players: PlayerState[]) => {
    dispatch(setPlayers(players));
  }, [dispatch]);

  const doApplyMove = useCallback((move: Move) => {
    dispatch(applyMove(move));
  }, [dispatch]);

  const clearBoard = useCallback(() => {
    dispatch(resetBoard());
  }, [dispatch]);

  return { game, updateGame, updatePlayers, doApplyMove, clearBoard } as const;
}
