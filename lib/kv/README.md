# Vercel KV Caching Utilities

This module provides caching utilities using Vercel KV (Redis-based) for the Farcaster Prediction Market application.

## Setup

### 1. Install Dependencies

```bash
npm install @vercel/kv
```

### 2. Create Vercel KV Database

1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → KV
3. Name your database (e.g., "prediction-market-cache")
4. Select your region
5. Click "Create"

### 3. Environment Variables

Vercel automatically adds these environment variables when you create a KV database:

```env
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
```

For local development, pull the environment variables:

```bash
vercel env pull
```

## Cache Strategy

### TTL (Time To Live) Configuration

| Cache Type | TTL | Reason |
|------------|-----|--------|
| Sessions | 24 hours | User authentication sessions |
| User profiles | 1 hour | Farcaster user data changes infrequently |
| Market list | 5 minutes | Balance between freshness and performance |
| Market details | 5 minutes | Same as market list |
| User bets | 5 minutes | Updated when new bets are placed |
| Odds | 30 seconds | Real-time feel for betting |

### Cache Invalidation Strategy

- **Market created** → Invalidate market list
- **Bet placed** → Invalidate market, odds, user bets
- **Market resolved** → Invalidate market, user bets
- **User updates** → Invalidate user cache

## Usage Examples

### Session Management

```typescript
import { setUserSession, getUserSession, deleteUserSession } from '@/lib/kv';

// Login
await setUserSession(fid, {
  fid: 12345,
  username: 'alice',
  displayName: 'Alice',
  pfpUrl: 'https://...',
  walletAddress: '0x...',
  expiresAt: Date.now() + 86400000, // 24 hours
});

// Check session
const session = await getUserSession(fid);

// Logout
await deleteUserSession(fid);
```

### User Cache

```typescript
import { cacheUser, getCachedUser } from '@/lib/kv';

// Cache user data from Farcaster Hub
await cacheUser({
  fid: 12345,
  username: 'alice',
  displayName: 'Alice',
  pfpUrl: 'https://...',
  bio: 'Crypto enthusiast',
  cachedAt: Date.now(),
});

// Retrieve cached user
const user = await getCachedUser(fid);
if (!user) {
  // Cache miss - fetch from Farcaster Hub
}
```

### Market Cache

```typescript
import {
  cacheMarkets,
  getCachedMarkets,
  cacheMarket,
  getCachedMarket,
  invalidateMarketCache,
} from '@/lib/kv';

// Cache market list
await cacheMarkets([
  {
    marketId: '1',
    title: 'Will ETH reach $5000?',
    // ... other fields
  },
]);

// Get cached markets
const markets = await getCachedMarkets();

// Cache individual market
await cacheMarket('1', marketData);

// Invalidate cache after update
await invalidateMarketCache('1');
```

### Odds Cache

```typescript
import { cacheOdds, getCachedOdds } from '@/lib/kv';

// Cache odds (30s TTL for real-time feel)
await cacheOdds('market-1', [1.5, 2.3, 3.1]);

// Get cached odds
const odds = await getCachedOdds('market-1');
if (!odds) {
  // Calculate from blockchain
}
```

### User Bets Cache

```typescript
import { cacheUserBets, getCachedUserBets, addBetToCache } from '@/lib/kv';

// Cache all user bets
await cacheUserBets(fid, [
  {
    marketId: '1',
    outcomeId: 0,
    amount: '1000000000000000000', // 1 ETH in wei
    timestamp: Date.now(),
  },
]);

// Add new bet to cache
await addBetToCache(fid, newBet);
```

## API Reference

### Session Functions

- `setUserSession(fid, session)` - Store user session
- `getUserSession(fid)` - Retrieve user session
- `deleteUserSession(fid)` - Delete user session
- `hasValidSession(fid)` - Check if session is valid

### User Cache Functions

- `cacheUser(user)` - Cache user data
- `getCachedUser(fid)` - Get cached user
- `invalidateUserCache(fid)` - Invalidate user cache
- `cacheUsers(users)` - Cache multiple users

### Market Cache Functions

- `cacheMarkets(markets)` - Cache market list
- `getCachedMarkets()` - Get cached market list
- `cacheMarket(marketId, market)` - Cache individual market
- `getCachedMarket(marketId)` - Get cached market
- `invalidateMarketCache(marketId?)` - Invalidate market cache
- `cacheMultipleMarkets(markets)` - Cache multiple markets

### User Bets Cache Functions

- `cacheUserBets(fid, bets)` - Cache user bets
- `getCachedUserBets(fid)` - Get cached user bets
- `invalidateUserBetsCache(fid)` - Invalidate user bets cache
- `addBetToCache(fid, bet)` - Add bet to cache

### Odds Cache Functions

- `cacheOdds(marketId, odds)` - Cache market odds
- `getCachedOdds(marketId)` - Get cached odds
- `invalidateOddsCache(marketId)` - Invalidate odds cache

### Utility Functions

- `clearMarketCache(marketId)` - Clear all cache for a market
- `clearUserCache(fid)` - Clear all user-related cache
- `getCacheStats()` - Get cache statistics
- `flushAllCache()` - Flush all cache (use with caution!)

## Best Practices

1. **Always check for cache misses** - If cache returns null, fetch from source
2. **Invalidate on writes** - Always invalidate relevant cache after blockchain writes
3. **Use appropriate TTLs** - Balance between freshness and performance
4. **Handle errors gracefully** - Cache failures shouldn't break the app
5. **Monitor cache usage** - Use `getCacheStats()` to monitor cache effectiveness

## Local Development

For local development without Vercel KV, you can:

1. Use a local Redis instance
2. Mock the KV functions for testing
3. Use Vercel CLI to pull environment variables

```bash
# Start local Redis
docker run -p 6379:6379 redis:7

# Pull Vercel environment variables
vercel env pull
```

## Vercel KV Limits (Free Tier)

- Storage: 256 MB
- Requests: 100,000 per month
- Bandwidth: 100 MB per month

Monitor your usage in the Vercel dashboard to avoid hitting limits.
