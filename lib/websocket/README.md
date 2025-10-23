# WebSocket Implementation

This directory contains the WebSocket implementation for real-time updates in the Farcaster Prediction Market application.

## Architecture

The WebSocket implementation uses:
- **Socket.io** for WebSocket server and client
- **Vercel KV pub/sub** for message broadcasting across serverless instances
- **Custom Next.js server** for Socket.io integration

## Files

- `server.ts` - Server-side WebSocket logic and event handlers
- `client.ts` - Client-side hooks for subscribing to WebSocket events
- `index.ts` - Main exports for both server and client
- `README.md` - This documentation file

## Server-Side Usage

### Initialize WebSocket Server

The WebSocket server is automatically initialized in `server.js`:

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL,
    methods: ['GET', 'POST'],
  },
});
```

### Broadcasting Events

Use the broadcast functions to send events to connected clients:

```typescript
import {
  broadcastMarketCreated,
  broadcastBetPlaced,
  broadcastOddsUpdated,
} from '@/lib/websocket';

// Broadcast market created
await broadcastMarketCreated({
  marketId: '123',
  title: 'Will ETH reach $5000?',
  category: 'crypto',
  creator: '0x...',
  endTime: Date.now() + 86400000,
});

// Broadcast bet placed
await broadcastBetPlaced({
  marketId: '123',
  outcomeId: 1,
  amount: '0.1',
  bettor: '0x...',
});

// Broadcast odds updated
await broadcastOddsUpdated({
  marketId: '123',
  odds: [1.5, 2.3, 3.1],
  totalPool: '10.5',
});
```

### API Route Integration

Example of integrating WebSocket broadcasts in API routes:

```typescript
// app/api/bets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { publishBetPlaced, publishOddsUpdated } from '@/lib/kv/pubsub';

export async function POST(request: NextRequest) {
  // ... place bet logic ...

  // Broadcast bet placed event
  await publishBetPlaced({
    marketId: bet.marketId,
    outcomeId: bet.outcomeId,
    amount: bet.amount.toString(),
    bettor: bet.user,
  });

  // Broadcast updated odds
  await publishOddsUpdated({
    marketId: bet.marketId,
    odds: newOdds,
    totalPool: market.totalPool.toString(),
  });

  return NextResponse.json({ success: true });
}
```

## Client-Side Usage

### WebSocket Provider

Wrap your app with the WebSocket provider:

```tsx
// app/layout.tsx
import { WebSocketProvider } from '@/lib/context/WebSocketContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WebSocketProvider autoConnect={true}>
          {children}
        </WebSocketProvider>
      </body>
    </html>
  );
}
```

### Using Hooks

#### Subscribe to Market Updates

```tsx
import { useMarketUpdates } from '@/lib/websocket';

function MarketDetail({ marketId }: { marketId: string }) {
  const marketData = useMarketUpdates(marketId);

  useEffect(() => {
    if (marketData) {
      console.log('Market updated:', marketData);
      // Update UI with new data
    }
  }, [marketData]);

  return <div>Market: {marketId}</div>;
}
```

#### Subscribe to Odds Updates

```tsx
import { useOddsUpdates } from '@/lib/websocket';

function OddsDisplay({ marketId }: { marketId: string }) {
  const odds = useOddsUpdates(marketId, (payload) => {
    console.log('Odds updated:', payload);
  });

  return (
    <div>
      {odds?.map((odd, index) => (
        <div key={index}>Outcome {index + 1}: {odd}x</div>
      ))}
    </div>
  );
}
```

#### Subscribe to Bet Placed Events

```tsx
import { useBetPlaced } from '@/lib/websocket';

function BetFeed({ marketId }: { marketId: string }) {
  const lastBet = useBetPlaced(marketId, (payload) => {
    // Show notification
    toast.success(`New bet placed: ${payload.amount} ETH`);
  });

  return <div>Last bet: {lastBet?.amount}</div>;
}
```

#### Subscribe to Market Resolution

```tsx
import { useMarketResolution } from '@/lib/websocket';

function MarketStatus({ marketId }: { marketId: string }) {
  const resolution = useMarketResolution(marketId, (payload) => {
    toast.success(`Market resolved! Winning outcome: ${payload.winningOutcome}`);
  });

  return resolution ? (
    <div>Winner: Outcome {resolution.winningOutcome}</div>
  ) : null;
}
```

#### Subscribe to All Market Events

```tsx
import { useMarketEvents } from '@/lib/websocket';

function MarketList() {
  useMarketEvents({
    onMarketCreated: (payload) => {
      console.log('New market created:', payload);
      // Refresh market list
    },
    onMarketResolved: (payload) => {
      console.log('Market resolved:', payload);
      // Update market status
    },
  });

  return <div>Market List</div>;
}
```

## Vercel KV Pub/Sub

The implementation uses Vercel KV pub/sub to broadcast events across serverless instances:

### Channels

- `channel:market:updates` - Market creation, updates, resolution, cancellation
- `channel:bet:updates` - Bet placement events
- `channel:odds:updates` - Odds calculation updates

### Publishing Events

```typescript
import {
  publishMarketCreated,
  publishBetPlaced,
  publishOddsUpdated,
} from '@/lib/kv/pubsub';

// Publish from any API route
await publishBetPlaced({
  marketId: '123',
  outcomeId: 1,
  amount: '0.1',
  bettor: '0x...',
});
```

## Running the Application

### Development

```bash
# Start the custom server with WebSocket support
node server.js
```

### Production (Vercel)

For Vercel deployment, WebSocket functionality will work through:
1. Vercel KV pub/sub for message broadcasting
2. Polling fallback for clients that can't establish WebSocket connections

Update `package.json`:

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "node server.js"
  }
}
```

## Environment Variables

Add to `.env`:

```bash
# WebSocket configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Vercel KV (for pub/sub)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

## Testing

### Check WebSocket Status

```bash
curl http://localhost:3000/api/socket
```

Response:
```json
{
  "status": "available",
  "connectedClients": 5,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test Client Connection

```typescript
import { createWebSocketClient } from '@/lib/websocket/client';

const socket = createWebSocketClient();

socket.on('connect', () => {
  console.log('Connected!');
});

socket.emit('join:market', 'market-123');
```

## Performance Considerations

1. **Connection Pooling**: Socket.io automatically manages connection pooling
2. **Room-based Broadcasting**: Events are only sent to clients in specific market rooms
3. **Cache Integration**: WebSocket events trigger cache invalidation
4. **Fallback to Polling**: Clients automatically fall back to polling if WebSocket fails

## Security

1. **CORS Configuration**: Restrict origins in production
2. **Authentication**: Validate user sessions before joining rooms
3. **Rate Limiting**: Implement rate limiting for event emissions
4. **Input Validation**: Validate all event payloads

## Troubleshooting

### WebSocket Connection Failed

- Check if custom server is running (`node server.js`)
- Verify `NEXT_PUBLIC_APP_URL` is correct
- Check browser console for CORS errors

### Events Not Received

- Verify client joined the correct room (`join:market`)
- Check server logs for pub/sub subscription errors
- Ensure Vercel KV is configured correctly

### High Memory Usage

- Limit number of rooms per client
- Implement connection cleanup on unmount
- Use room-based broadcasting instead of global broadcasts
