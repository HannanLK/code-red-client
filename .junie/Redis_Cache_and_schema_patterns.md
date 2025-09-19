# Redis Cache Schema and Patterns

## Key Naming Conventions

All Redis keys follow the pattern: `{namespace}:{entity}:{identifier}:{property}`

## 1. Active Game State Management

### Game State
```
game:{game_id}:state
Type: Hash
TTL: 24 hours after game completion
Fields:
  - board: JSON string of 2D array
  - tile_bag: JSON string of remaining tiles
  - current_player: UUID
  - turn_number: integer
  - last_move: JSON string
  - status: active|paused|completed
```

### Player Racks
```
game:{game_id}:player:{player_id}:rack
Type: List
TTL: 24 hours after game completion
Values: Individual tile strings
```

### Game Timers
```
game:{game_id}:timer:{player_id}
Type: String (milliseconds remaining)
TTL: 24 hours after game completion
```

### Turn Lock (prevents concurrent moves)
```
game:{game_id}:turn_lock
Type: String with SET NX
TTL: 30 seconds
Value: player_id making the move
```

## 2. Matchmaking & Lobby

### Lobby Queue
```
queue:lobby:{game_mode}
Type: Sorted Set
Score: Unix timestamp of join time
Member: user_id
```

### User Queue Status
```
queue:user:{user_id}:status
Type: Hash
TTL: 5 minutes
Fields:
  - game_mode: classic|timed|challenge
  - rating_min: integer
  - rating_max: integer
  - joined_at: timestamp
```

### Available Bots
```
bots:available:{difficulty}
Type: Set
Members: bot_id
```

## 3. Real-time Presence

### Online Users
```
presence:online
Type: Set
Members: user_id
```

### User Status
```
presence:user:{user_id}:status
Type: Hash
TTL: 5 minutes (refreshed on activity)
Fields:
  - status: online|away|in_game
  - current_game: game_id (optional)
  - last_seen: timestamp
```

### Game Spectators
```
game:{game_id}:spectators
Type: Set
Members: user_id
```

## 4. Session Management

### User Sessions
```
session:{session_token}
Type: Hash
TTL: 24 hours
Fields:
  - user_id: UUID
  - ip_address: string
  - user_agent: string
  - created_at: timestamp
  - last_activity: timestamp
```

### Active User Games
```
user:{user_id}:active_games
Type: Set
Members: game_id
```

## 5. Caching Layer

### Word Validation Cache
```
dict:{dictionary_id}:word:{word}
Type: String
TTL: 7 days
Value: "1" (valid) or "0" (invalid)
```

### Recent Words Cache
```
dict:{dictionary_id}:recent
Type: List (capped at 1000)
Values: Recently validated words
```

### User Statistics Cache
```
user:{user_id}:stats
Type: Hash
TTL: 1 hour
Fields:
  - total_games: integer
  - games_won: integer
  - avg_score: float
  - highest_score: integer
  - total_bingos: integer
```

### Leaderboard Cache
```
leaderboard:{game_mode}:{period}
Type: Sorted Set
TTL: 15 minutes
Score: Rating/Score
Member: user_id:username composite
Period: daily|weekly|monthly|alltime
```

## 6. Real-time Messaging

### Game Chat Messages
```
chat:game:{game_id}
Type: List (capped at 100 messages)
Values: JSON message objects
```

### Unread Notifications
```
notifications:{user_id}:unread
Type: List
Values: JSON notification objects
```

### Notification Count
```
notifications:{user_id}:count
Type: String
Value: Integer count of unread
```

## 7. Rate Limiting

### API Rate Limits
```
ratelimit:{user_id}:{endpoint}
Type: String with INCR
TTL: 1 minute
Value: Request count
```

### Move Rate Limit
```
ratelimit:game:{game_id}:player:{player_id}
Type: String
TTL: 5 seconds
Value: "1" (prevents rapid moves)
```

## 8. Temporary Data

### Move Validation
```
temp:move:{game_id}:{move_id}
Type: Hash
TTL: 60 seconds
Fields:
  - player_id: UUID
  - word: string
  - position: string
  - direction: H|V
  - tiles_used: JSON array
  - score: integer
  - validation_status: pending|valid|invalid
```

### Exchange Buffer
```
temp:exchange:{game_id}:{player_id}
Type: Set
TTL: 60 seconds
Members: Tiles to exchange
```

## 9. Bot Decision Cache

### Bot Move Cache
```
bot:{bot_id}:game:{game_id}:moves
Type: Sorted Set
TTL: 5 minutes
Score: Move evaluation score
Member: JSON move object
```

### Opening Book Cache
```
bot:opening:{board_hash}
Type: List
TTL: 1 day
Values: JSON move objects
```

## 10. WebSocket Management

### Socket Connections
```
ws:user:{user_id}:sockets
Type: Set
Members: socket_id
```

### Socket Room Membership
```
ws:room:{room_id}:members
Type: Set
Members: socket_id
Room types: game:{game_id}, lobby, user:{user_id}
```

## 11. Performance Monitoring

### Request Metrics
```
metrics:api:{endpoint}:{date}
Type: Hash
Fields:
  - count: integer
  - total_time: milliseconds
  - errors: integer
  - p95: milliseconds
  - p99: milliseconds
```

### Game Performance
```
metrics:games:{date}
Type: Hash
Fields:
  - created: integer
  - completed: integer
  - abandoned: integer
  - avg_duration: seconds
  - avg_moves: integer
```

## Redis Lua Scripts

### Atomic Move Validation and Execution
```lua
-- validate_and_execute_move.lua
local game_key = KEYS[1]
local lock_key = KEYS[2]
local player_id = ARGV[1]
local move_data = ARGV[2]

-- Acquire turn lock
if redis.call('SET', lock_key, player_id, 'NX', 'EX', 30) then
    -- Validate it's player's turn
    local current_player = redis.call('HGET', game_key, 'current_player')
    if current_player == player_id then
        -- Update game state
        redis.call('HSET', game_key, 'last_move', move_data)
        redis.call('HINCRBY', game_key, 'turn_number', 1)
        return 1
    else
        redis.call('DEL', lock_key)
        return -1 -- Not player's turn
    end
else
    return 0 -- Lock acquisition failed
end
```

### Matchmaking Script
```lua
-- matchmaking.lua
local queue_key = KEYS[1]
local game_mode = ARGV[1]
local rating = tonumber(ARGV[2])
local range = tonumber(ARGV[3])

-- Find compatible player
local players = redis.call('ZRANGEBYSCORE', queue_key, 
    rating - range, rating + range, 'LIMIT', 0, 1)

if #players > 0 then
    -- Remove from queue and return match
    redis.call('ZREM', queue_key, players[1])
    return players[1]
else
    return nil
end
```

## Connection Pooling Configuration

```javascript
// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  
  // Connection pool settings
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  maxRetries: 10,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  
  // Performance settings
  enableOfflineQueue: true,
  connectTimeout: 10000,
  keepAlive: 30000,
  
  // Cluster settings (if using Redis Cluster)
  clusterRetryStrategy: (times) => Math.min(100 + times * 2, 2000),
}
```

## Cache Invalidation Patterns

### Cascade Invalidation
When game ends:
1. Move game state to PostgreSQL
2. Delete `game:{game_id}:*` keys
3. Update user statistics cache
4. Invalidate affected leaderboards
5. Archive chat messages

### Lazy Loading Pattern
1. Check cache for data
2. If miss, load from PostgreSQL
3. Set in cache with appropriate TTL
4. Return data

### Write-Through Pattern
1. Write to PostgreSQL
2. Update cache immediately
3. Set appropriate TTL
4. Broadcast update via WebSocket

## Monitoring Keys

### Health Check Keys
```
health:redis:ping - Simple ping check
health:redis:write - Write test
health:redis:memory - Memory usage stats
health:redis:connections - Active connections count
```