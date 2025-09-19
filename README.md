Code-Red Client (Next.js + React + Redux)

Overview
This is the Scrabble client for Code‑Red. It connects to the central Socket.IO server to play 2‑player games (human vs human or human vs bot). The client enforces UI interactions while the server is the source of truth for game state and the secure timer.

Quick start
1) Install dependencies
   npm install

2) Run the dev server
   npm run dev

3) Open the app in your browser
   http://localhost:3000

Core features
- Drag & Drop from rack to board: drag a tile from your rack and drop it on a board square to stage a move. The tile will show as a ghost tile until the move is submitted.
- Rack management: drag within the rack to rearrange tiles. Click Shuffle to randomize.
- Keyboard input: click a starting square; type letters to place along a line; press Enter to toggle direction; Esc to clear selection.
- Multiplayer aware: the rack displayed belongs to the signed‑in user where available; client prevents placing tiles when it’s not your turn and shows a warning.
- Server‑synced timer: the UI displays and follows the server’s authoritative 10‑minute game clock per player.

How drag & drop works
- Rearranging the rack uses react‑dnd with a local reorder for instant feedback and Redux persistence when the rack belongs to the store player.
- Dropping onto the board:
  - If it’s your turn, the client selects the target square and stages a ghost tile at that position.
  - If it’s not your turn, a discrete warning is shown and the drop is ignored.
  - Blank tiles: you can drag them too; they’ll appear as blank ghost tiles. Assigning a letter is supported via keyboard input (hold Shift while typing) when submitting a real move.

Socket.IO events (client-side)
- Listens: 'game:state' (authoritative game state), 'timer-sync', 'timer-expired'.
- Emits: 'join-game', 'make-move', 'pass-turn', 'game:start'.

Project structure (client)
- src/components/game/Board: The Scrabble board grid and drop targets for tiles.
- src/components/game/Rack: The player rack; supports drag within rack and drag to board.
- src/features/game/gameSlice: Redux state for board, players, racks, ghost tiles, and warnings.
- src/hooks/useKeyboardInput: Typing-to-place tiles, rack validation, and client warnings.

Multiplayer notes
- The client chooses the rack for the authenticated user when present; otherwise falls back to the player whose turn it is.
- The server is authoritative for players, racks, board, and current turn. The client merges incoming state conservatively if racks are missing during development.

Build & deployment
- Dev: npm run dev
- Build: npm run build && npm start

Troubleshooting
- “Tiles visible but can’t drag to board”: ensure the server and client are on matching event names ('game:state'). The client must run under a browser with pointer events enabled. Drag from inside the rack tile, not the score label.
- “My rack is empty”: in development, the client generates a demo rack if the server doesn’t send one yet.
