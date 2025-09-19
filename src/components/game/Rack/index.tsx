"use client";
import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import Tile from '@/components/game/Tile';
import { Card, CardContent, CardFooter } from '@/components/common/ui/card';
import { Button } from '@/components/common/ui/button';
import { useDrag, useDrop } from 'react-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tile as TileType } from '@/types/game';
import { shuffleRack } from '@/features/game/gameSlice';

// DnD item type
export const DND_ITEM = 'RACK_TILE';

export interface RackProps {
  tiles: TileType[];
  onTileSelect: (index: number) => void;
  onRearrange: (fromIndex: number, toIndex: number) => void;
  onShuffle: () => void;
  selectedTileIndex: number | null;
}

interface DragItem {
  type: typeof DND_ITEM;
  index: number;
  tile: TileType;
}

function useRackSources(index: number, canDrag: boolean, tile: TileType) {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: DND_ITEM,
    item: { type: DND_ITEM, index, tile } as DragItem,
    canDrag,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }), [index, canDrag, tile]);
  return { dragRef, isDragging } as const;
}

function useRackTarget(onHoverIndex: (hoverIndex: number, draggedIndex: number) => void, toIndex: number) {
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: DND_ITEM,
      drop: (item: DragItem) => onHoverIndex(toIndex, item.index),
      hover: () => {
        // Optional live feedback could be added here
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [toIndex, onHoverIndex]
  );
  return { dropRef, isOver, canDrop } as const;
}

function DropZone({ onMove, toIndex }: { onMove: (to: number, from: number) => void; toIndex: number }) {
  const { dropRef, isOver } = useRackTarget((to, from) => {
    if (from !== to) onMove(to, from);
  }, toIndex);
  return (
    <div
      ref={dropRef as unknown as React.Ref<HTMLDivElement>}
      aria-hidden
      className={`w-2 sm:w-3 my-1 rounded ${isOver ? 'bg-amber-400' : 'bg-transparent'}`}
    />
  );
}

function RackTile({
  tile,
  index,
  selected,
  onClick,
  canDrag = true,
}: {
  tile: TileType;
  index: number;
  selected: boolean;
  onClick: () => void;
  canDrag?: boolean;
}) {
  const { dragRef, isDragging } = useRackSources(index, canDrag, tile);

  return (
    <motion.button
      ref={dragRef as unknown as React.Ref<HTMLButtonElement>}
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={`relative grid place-items-center rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${selected ? 'ring-2 ring-amber-500' : ''}`}
      style={{ touchAction: 'none' }}
      layout
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      aria-label={`Rack tile ${tile.isBlank ? 'blank' : tile.letter} worth ${tile.points} points`}
    >
      <motion.div animate={isDragging ? { opacity: 0.5 } : { opacity: 1 }}>
        <Tile tile={tile} />
      </motion.div>
    </motion.button>
  );
}

export function Rack(props?: Partial<RackProps>) {
  const dispatch = useAppDispatch();
  // Fallback to store if props not provided, with multiplayer awareness
  const authUser = useAppSelector((s) => s.auth.user);
  const players = useAppSelector((s) => s.game.game.players);
  const currentTurnPlayerId = useAppSelector((s) => s.game.game.currentTurnPlayerId);
  const storePlayer = React.useMemo(() => {
    if (props?.tiles) return null; // controlled mode, ignore store
    const byAuth = players.find(p => p.id === authUser?.id) || null;
    if (byAuth) return byAuth;
    const byTurn = players.find(p => p.id === currentTurnPlayerId) || null;
    if (byTurn) return byTurn;
    return players[0] || null;
  }, [players, authUser?.id, currentTurnPlayerId, props?.tiles]);
  const sourceTiles = props?.tiles ?? storePlayer?.rack ?? [];
  const tiles = React.useMemo(() => sourceTiles.slice(0, 7), [sourceTiles]);
  const [localTiles, setLocalTiles] = React.useState<TileType[]>(tiles);
  const controlled = Boolean(props && props.tiles);

  React.useEffect(() => {
    if (!controlled) setLocalTiles(tiles);
  }, [sourceTiles, controlled]);

  const selectedIndex = props?.selectedTileIndex ?? null;

  const onTileSelect = (idx: number) => props?.onTileSelect?.(idx);

  const onRearrange = (from: number, to: number) => {
    const arr = [...(controlled ? (props!.tiles as TileType[]) : localTiles)];
    if (from < 0 || from >= arr.length) return;
    const [moved] = arr.splice(from, 1);
    const insertAt = Math.max(0, Math.min(arr.length, to));
    arr.splice(insertAt, 0, moved);
    if (controlled) {
      props?.onRearrange?.(from, insertAt);
    } else {
      setLocalTiles(arr);
    }
  };

  const onShuffle = () => {
    // If using store-backed rack, dispatch a shuffle so it persists and works in multiplayer too
    if (!controlled && storePlayer) {
      dispatch(shuffleRack(storePlayer.id));
      return;
    }
    // Fallback local shuffle (controlled or purely local usage)
    const arr = [...(controlled ? (props!.tiles as TileType[]) : localTiles)];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (controlled) props?.onShuffle?.();
    else setLocalTiles(arr);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!tiles.length) return;
    const max = tiles.length - 1;
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key)) e.preventDefault();
    const cur = selectedIndex ?? 0;
    if (e.key === 'ArrowLeft') props?.onTileSelect?.(Math.max(0, cur - 1));
    if (e.key === 'ArrowRight') props?.onTileSelect?.(Math.min(max, cur + 1));

    // Rearrange with Ctrl/Cmd + Arrow
    const isMod = e.ctrlKey || e.metaKey;
    if (isMod && e.key === 'ArrowLeft' && cur > 0) onRearrange(cur, cur - 1);
    if (isMod && e.key === 'ArrowRight' && cur < max) onRearrange(cur, cur + 1);

    if (e.key === 'Home') props?.onTileSelect?.(0);
    if (e.key === 'End') props?.onTileSelect?.(max);
    if (e.key === 'Enter' && cur != null) props?.onTileSelect?.(cur);
  };

  const currentTiles = controlled ? (props!.tiles as TileType[]) : localTiles;

  return (
    <Card role="group" aria-label="Player tile rack">
      <CardContent className="p-3">
        <div
          className="flex items-center gap-1 select-none"
          role="listbox"
          aria-orientation="horizontal"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {/* Leading drop zone (index 0) */}
          <DropZone onMove={(to, from) => onRearrange(from, to)} toIndex={0} />

          <AnimatePresence initial={false}>
            {currentTiles.map((t, idx) => (
              <React.Fragment key={idx}>
                <RackTile
                  tile={t}
                  index={idx}
                  selected={selectedIndex === idx}
                  onClick={() => onTileSelect?.(idx)}
                />
                {/* Drop zone after each tile -> target index is idx+1 */}
                <DropZone onMove={(to, from) => onRearrange(from, to)} toIndex={idx + 1} />
              </React.Fragment>
            ))}
          </AnimatePresence>

          {currentTiles.length === 0 && (
            <span className="opacity-60 text-sm">Empty rack</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onShuffle}
          aria-label="Shuffle rack"
          asChild={false}
        >
          <motion.span whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }}>
            Shuffle
          </motion.span>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default Rack;
