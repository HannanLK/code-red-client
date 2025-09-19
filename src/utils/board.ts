import { BOARD_SIZE, type BoardCell } from '@/types/game';

export type Premium = 'DL' | 'TL' | 'DW' | 'TW' | 'CENTER';

// Coordinate helpers
const setOf = (coords: Array<[number, number]>) => new Set(coords.map(([r, c]) => `${r},${c}`));

// Classic Scrabble premium coordinates
const TW = setOf([
  [0, 0], [0, 7], [0, 14],
  [7, 0], [7, 14],
  [14, 0], [14, 7], [14, 14],
]);

const DW = setOf([
  [1, 1], [2, 2], [3, 3], [4, 4],
  [13, 13], [12, 12], [11, 11], [10, 10],
  [1, 13], [2, 12], [3, 11], [4, 10],
  [13, 1], [12, 2], [11, 3], [10, 4],
  [7, 7], // center
]);

const TL = setOf([
  [1, 5], [1, 9],
  [5, 1], [5, 5], [5, 9], [5, 13],
  [9, 1], [9, 5], [9, 9], [9, 13],
  [13, 5], [13, 9],
]);

const DL = setOf([
  [0, 3], [0, 11],
  [2, 6], [2, 8],
  [3, 0], [3, 7], [3, 14],
  [6, 2], [6, 6], [6, 8], [6, 12],
  [7, 3], [7, 11],
  [8, 2], [8, 6], [8, 8], [8, 12],
  [11, 0], [11, 7], [11, 14],
  [12, 6], [12, 8],
  [14, 3], [14, 11],
]);

export function getPremiumAt(row: number, col: number): Premium | undefined {
  if (row === 7 && col === 7) return 'CENTER';
  const key = `${row},${col}`;
  if (TW.has(key)) return 'TW';
  if (DW.has(key)) return 'DW';
  if (TL.has(key)) return 'TL';
  if (DL.has(key)) return 'DL';
  return undefined;
}

export function withPremiums(grid: BoardCell[][]): BoardCell[][] {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = getPremiumAt(r, c);
      if (p) grid[r][c].premium = p === 'CENTER' ? 'CENTER' : p;
    }
  }
  return grid;
}

export type Position = { row: number; col: number };
export type Direction = 'H' | 'V';

export function inBounds(row: number, col: number) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function nextPos(pos: Position, dir: Direction): Position {
  return dir === 'H' ? { row: pos.row, col: pos.col + 1 } : { row: pos.row + 1, col: pos.col };
}

export function computeValidPath(
  grid: BoardCell[][],
  start: Position,
  dir: Direction,
  maxLen = BOARD_SIZE
): Position[] {
  const result: Position[] = [];
  let cur: Position = { ...start };
  for (let i = 0; i < maxLen; i++) {
    if (!inBounds(cur.row, cur.col)) break;
    const cell = grid[cur.row][cur.col];
    if (cell.tile) break;
    result.push({ ...cur });
    cur = nextPos(cur, dir);
  }
  return result;
}
