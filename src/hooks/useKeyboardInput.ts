import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { placeGhostTile, removeLastGhostTile, redoGhostTile, clearGhostTiles, setWarnings } from '@/features/game/gameSlice';
import type { Direction, Position, ValidationWarning } from '@/types/game';

// Debounce helper
function debounce<A extends unknown[]>(fn: (...args: A) => void, delay = 12) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

export function useKeyboardInput() {
  const dispatch = useAppDispatch();
  const board = useAppSelector((s) => s.game.game.board);
  const ui = useAppSelector((s) => s.game.boardUI);
  const player = useAppSelector((s) => s.game.game.players[0]);

  const validatePlacement = useCallback((position: Position, letter: string) => {
    // Must be within valid path and empty on board
    const inPath = ui.validPlacements.some((p) => p.row === position.row && p.col === position.col);
    if (!inPath) return false;
    const cell = board[position.row][position.col];
    if (cell.tile) return false;
    // Ensure tile exists in rack considering ghostTiles consumption
    const rackLetters = (player?.rack ?? []).map((t) => (t.isBlank ? '?' : (t.letter ?? '')));
    const placedLetters = ui.ghostTiles.map(g => g.isBlank ? '?' : g.letter.toUpperCase());
    const needed = letter.toUpperCase();
    // Try exact letter
    const availableCounts: Record<string, number> = {};
    for (const l of rackLetters) availableCounts[l] = (availableCounts[l] ?? 0) + 1;
    for (const l of placedLetters) availableCounts[l] = (availableCounts[l] ?? 0) - 1;
    if ((availableCounts[needed] ?? 0) > 0) return true;
    // Allow blank as wildcard
    if ((availableCounts['?'] ?? 0) > 0) return true;
    return false;
  }, [board, player?.rack, ui.validPlacements, ui.ghostTiles]);

  const getNextPosition = useCallback((current: Position, direction: Direction): Position => {
    return direction === 'H' ? { row: current.row, col: current.col + 1 } : { row: current.row + 1, col: current.col };
  }, []);

  const placeLetter = useCallback((raw: string, isBlank: boolean) => {
    const letter = raw.toUpperCase();
    const pos = ui.selectedSquare ?? { row: 7, col: 7 };
    if (!validatePlacement(pos, letter)) {
      const w: ValidationWarning = { type: 'INVALID_TILE', message: 'Tile not available or position invalid', severity: 'warning', position: pos };
      dispatch(setWarnings([w]));
      return;
    }
    dispatch(setWarnings([]));
    dispatch(placeGhostTile({ position: pos, letter, isBlank }));
  }, [dispatch, ui.selectedSquare, validatePlacement]);

  const debouncedPlaceLetter = useMemo(() => debounce(placeLetter, 8), [placeLetter]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore when typing in inputs/textareas/contenteditable
    const target = e.target as HTMLElement | null;
    if (target) {
      const tag = target.tagName?.toLowerCase();
      const isEditable = (target as HTMLElement).isContentEditable;
      if (tag === 'input' || tag === 'textarea' || isEditable) {
        return; // don't hijack typing, allow Backspace to work in fields
      }
    }
    // Basic controls
    if (e.key === 'Backspace') {
      e.preventDefault();
      dispatch(removeLastGhostTile());
      return;
    }
    if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      dispatch(removeLastGhostTile());
      return;
    }
    if (e.key.toLowerCase() === 'y' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      dispatch(redoGhostTile());
      return;
    }
    if (e.key === 'Escape') {
      dispatch(clearGhostTiles());
      return;
    }
    if (e.key.toLowerCase() === 'x') {
      // Exchange dialog trigger will be handled by component state
      const w: ValidationWarning = { type: 'INVALID_TURN', message: 'Open exchange dialog (X)', severity: 'warning' };
      dispatch(setWarnings([w]));
      return;
    }
    // Submit is handled by parent to send move
    // Letters
    if (/^[a-zA-Z]$/.test(e.key)) {
      const isBlank = e.shiftKey; // Shift + letter => blank assignment
      debouncedPlaceLetter(e.key, isBlank);
      return;
    }
  }, [debouncedPlaceLetter, dispatch]);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  return {
    onLetterPress: placeLetter,
    onSubmit: () => {},
    onCancel: () => dispatch(clearGhostTiles()),
    onExchange: () => {},
    validatePlacement,
    getNextPosition,
  } as const;
}
