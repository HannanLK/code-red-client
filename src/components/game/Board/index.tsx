"use client";
import React from 'react';
import { Card, CardContent } from '@/components/common/ui/card';
import { useAppDispatch, useAppSelector } from '@/store';
import { BOARD_SIZE, type BoardCell, type Letter } from '@/types/game';
import { selectSquare, toggleDirection, setZoom, clearSelection, placeGhostTile, setWarnings } from '@/features/game/gameSlice';
import Tile from '@/components/game/Tile';
import { Button } from '@/components/common/ui/button';
import { useKeyboardInput } from '@/hooks/useKeyboardInput';
import { useDrop } from 'react-dnd';
import { DND_ITEM } from '@/components/game/Rack';

const PREMIUM_COLORS: Record<string, string> = {
  TW: 'bg-rose-500/20 text-rose-600 dark:text-rose-300',
  DW: 'bg-pink-500/20 text-pink-600 dark:text-pink-300',
  TL: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300',
  DL: 'bg-sky-500/20 text-sky-600 dark:text-sky-300',
  CENTER: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300',
};

function useTileSize() {
  const zoom = useAppSelector((s) => s.game.boardUI.zoom);
  const base = 32; // px
  return Math.round(base * zoom);
}

const Square = React.memo(function Square({
  cell,
  row,
  col,
  size,
  selected,
  isValid,
  showArrow,
  direction,
  onClick,
  ghost,
  invalid,
}: {
  cell: BoardCell;
  row: number;
  col: number;
  size: number;
  selected: boolean;
  isValid: boolean;
  showArrow: boolean;
  direction: 'H' | 'V';
  onClick: () => void;
  ghost?: { letter: string; isBlank?: boolean } | null;
  invalid?: boolean;
}) {
  const premium = cell.premium;
  const classes = [
    'relative border border-black/10 dark:border-white/10 grid place-items-center text-[11px] select-none hover:ring-1 hover:ring-blue-400/40',
    premium ? PREMIUM_COLORS[premium] : 'bg-black/5 dark:bg-white/5',
    selected ? 'ring-2 ring-amber-500' : '',
    isValid ? 'outline outline-2 outline-emerald-500/60' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      role="gridcell"
      aria-selected={selected}
      aria-label={`Row ${row + 1}, Column ${col + 1}${cell.tile ? ` tile ${cell.tile.letter}` : premium ? ` ${premium}` : ''}`}
      className={classes}
      style={{ width: size, height: size }}
      onClick={onClick}
      tabIndex={-1}
    >
      {/* Premium label when empty */}
      {!cell.tile && !ghost && premium && (
        <span className="pointer-events-none text-[10px] font-semibold">{premium === 'CENTER' ? '★' : premium}</span>
      )}
      {/* Tile */}
      {cell.tile && <Tile tile={cell.tile} size={size - 6} />}
      {/* Ghost tile */}
      {!cell.tile && ghost && (
        <div className={`opacity-70 ${invalid ? 'outline outline-2 outline-red-500' : ''}`}>
          <Tile tile={{ letter: ghost.isBlank ? null : (ghost.letter as Letter), points: 0, isBlank: !!ghost.isBlank }} size={size - 8} />
        </div>
      )}
      {/* Direction arrow */}
      {showArrow && (
        <div className="absolute inset-0 pointer-events-none">
          {direction === 'H' ? (
            <div className="absolute right-1 top-1 text-amber-500">→</div>
          ) : (
            <div className="absolute right-1 top-1 text-amber-500">↓</div>
          )}
        </div>
      )}
    </button>
  );
});

const CellDrop = React.memo(function CellDrop({ r, c, dispatch, authUserId, currentTurnPlayerId, isParticipant, square }: { r: number; c: number; dispatch: any; authUserId?: string | null; currentTurnPlayerId?: string | null; isParticipant?: boolean; square: { cell: BoardCell; row: number; col: number; size: number; selected: boolean; isValid: boolean; showArrow: boolean; direction: 'H' | 'V'; onClick: () => void; ghost?: { letter: string; isBlank?: boolean } | null; invalid?: boolean; }; }) {
  const [, dropRef] = useDrop(() => ({
    accept: DND_ITEM,
    drop: (item: any) => {
      // Enforce turn only if the authenticated user is a participant in this game
      if (isParticipant && authUserId && currentTurnPlayerId && authUserId !== currentTurnPlayerId) {
        dispatch(setWarnings([{ type: 'turn', message: 'Invalid Turn: Not your turn', severity: 'warning', position: { row: r, col: c } }]));
        return;
      }
      dispatch(selectSquare({ row: r, col: c }));
      const letter = item.tile?.isBlank ? 'A' : (item.tile?.letter || 'A');
      const isBlank = !!item.tile?.isBlank;
      dispatch(placeGhostTile({ position: { row: r, col: c }, letter, isBlank }));
    },
  }), [dispatch, r, c, authUserId, currentTurnPlayerId, isParticipant]);
  return (
    <div ref={dropRef as unknown as React.Ref<HTMLDivElement>}>
      <Square {...square} />
    </div>
  );
});

export function Board() {
  const dispatch = useAppDispatch();
  const board = useAppSelector((s) => s.game.game.board);
  const ui = useAppSelector((s) => s.game.boardUI);
  const currentTurnPlayerId = useAppSelector((s) => s.game.game.currentTurnPlayerId);
  const players = useAppSelector((s) => s.game.game.players);
  const authUser = useAppSelector((s) => s.auth.user);
  const size = useTileSize();
  // init keyboard handler
  useKeyboardInput();

  // Mobile virtualization: compute visible window
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerH, setContainerH] = React.useState(0);
  const rowH = size + 2; // px
  const overscan = 2;
  const [scrollTop, setScrollTop] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onResize = () => setContainerH(el.clientHeight);
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [size]);

  const totalHeight = BOARD_SIZE * rowH;
  const startRow = Math.max(0, Math.floor(scrollTop / rowH) - overscan);
  const visibleRows = Math.ceil(containerH / rowH) + overscan * 2;
  const endRow = Math.min(BOARD_SIZE, startRow + visibleRows);
  const padTop = startRow * rowH;
  const padBottom = totalHeight - endRow * rowH;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(e.key)) e.preventDefault();
    const sel = ui.selectedSquare ?? { row: 7, col: 7 };
    switch (e.key) {
      case 'ArrowUp':
        if (sel.row > 0) dispatch(selectSquare({ row: sel.row - 1, col: sel.col }));
        break;
      case 'ArrowDown':
        if (sel.row < BOARD_SIZE - 1) dispatch(selectSquare({ row: sel.row + 1, col: sel.col }));
        break;
      case 'ArrowLeft':
        if (sel.col > 0) dispatch(selectSquare({ row: sel.row, col: sel.col - 1 }));
        break;
      case 'ArrowRight':
        if (sel.col < BOARD_SIZE - 1) dispatch(selectSquare({ row: sel.row, col: sel.col + 1 }));
        break;
      case 'Enter':
        dispatch(toggleDirection());
        break;
      case 'Escape':
        dispatch(clearSelection());
        break;
    }
  };

  const isValidPos = (r: number, c: number) => ui.validPlacements.some((p) => p.row === r && p.col === c);
  const ghostMap = React.useMemo(() => {
    const m = new Map<string, { letter: string; isBlank?: boolean }>();
    ui.ghostTiles.forEach(g => m.set(`${g.position.row},${g.position.col}`, { letter: g.letter, isBlank: g.isBlank }));
    return m;
  }, [ui.ghostTiles]);
  const invalidSet = React.useMemo(() => {
    const s = new Set<string>();
    ui.warnings.forEach(w => { if (w.position) s.add(`${w.position.row},${w.position.col}`); });
    return s;
  }, [ui.warnings]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm opacity-80">
            {ui.selectedSquare ? `Selected: ${ui.selectedSquare.row + 1},${ui.selectedSquare.col + 1} (${ui.direction})` : 'Select a square'}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" aria-label="Zoom out" onClick={() => dispatch(setZoom(ui.zoom - 0.1))}>−</Button>
            <div className="w-10 text-center text-sm">{Math.round(ui.zoom * 100)}%</div>
            <Button variant="outline" size="sm" aria-label="Zoom in" onClick={() => dispatch(setZoom(ui.zoom + 0.1))}>+</Button>
          </div>
        </div>

        {ui.warnings.length > 0 && (
          <div className="mb-2 text-sm">
            {ui.warnings.map((w, idx) => (
              <div key={idx} className={`${w.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`}>{w.message}</div>
            ))}
          </div>
        )}

        <div
          ref={containerRef}
          onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
          className="max-h-[60vh] overflow-auto outline-none"
          role="grid"
          aria-rowcount={BOARD_SIZE}
          aria-colcount={BOARD_SIZE}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <div style={{ paddingTop: padTop, paddingBottom: padBottom }}>
            {/* rows */}
            {board.slice(startRow, endRow).map((row, rIdx) => (
              <div key={startRow + rIdx} role="row" className="flex">
                {row.map((cell, cIdx) => {
                  const r = startRow + rIdx;
                  const c = cIdx;
                  const selected = ui.selectedSquare?.row === r && ui.selectedSquare?.col === c;
                  const showArrow = selected;
                  const key = `${r},${c}`;
                  const ghost = ghostMap.get(key) ?? null;
                  const invalid = invalidSet.has(key);
                  const isParticipant = !!(authUser?.id && players.some(p => p.id === authUser!.id));
                  return (
                    <CellDrop
                      key={`${r}-${c}`}
                      r={r}
                      c={c}
                      dispatch={dispatch}
                      authUserId={authUser?.id ?? null}
                      currentTurnPlayerId={currentTurnPlayerId ?? null}
                      isParticipant={isParticipant}
                      square={{
                        cell,
                        row: r,
                        col: c,
                        size,
                        selected,
                        isValid: isValidPos(r, c),
                        showArrow,
                        direction: ui.direction,
                        onClick: () => dispatch(selectSquare({ row: r, col: c })),
                        ghost,
                        invalid,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Board;
