# Social Components

This directory contains components for Farcaster social integration.

## Components

### ShareButton
Base component for sharing content on Farcaster.

```tsx
import { ShareButton } from '@/components/social';

<ShareButton
  type="market"
  data={{ marketId: '123', customText: 'Check this out!' }}
/>
```

### ShareMarketButton
Specialized button for sharing markets.

```tsx
import { ShareMarketButton } from '@/components/social';

<ShareMarketButton
  marketId="123"
  variant="default" // or "compact" or "icon"
/>
```

### ShareBetButton
Button for sharing placed bets.

```tsx
import { ShareBetButton } from '@/components/social';

<ShareBetButton
  marketId="123"
  outcomeId={0}
  amount="1000000000000000000" // 1 ETH in wei
  variant="default" // or "compact"
/>
```

### ShareWinButton
Button for sharing wins.

```tsx
import { ShareWinButton } from '@/components/social';

<ShareWinButton
  marketId="123"
  winnings="2000000000000000000" // 2 ETH in wei
  variant="default" // or "compact"
/>
```

### SocialFeed
Display follower activities from Farcaster.

```tsx
import { SocialFeed } from '@/components/social';

<SocialFeed
  fid={123}
  limit={25}
/>
```

## Usage Examples

### In Market Detail Page

```tsx
import { ShareMarketButton } from '@/components/social';

export default function MarketDetail({ marketId }) {
  return (
    <div>
      <h1>Market Title</h1>
      <ShareMarketButton marketId={marketId} />
    </div>
  );
}
```

### After Placing a Bet

```tsx
import { ShareBetButton } from '@/components/social';

function BetConfirmation({ marketId, outcomeId, amount }) {
  return (
    <div>
      <p>Bet placed successfully!</p>
      <ShareBetButton
        marketId={marketId}
        outcomeId={outcomeId}
        amount={amount}
      />
    </div>
  );
}
```

### In Profile Page

```tsx
import { SocialFeed } from '@/components/social';

function ProfilePage({ fid }) {
  return (
    <div>
      <h2>Activity Feed</h2>
      <SocialFeed fid={fid} limit={25} />
    </div>
  );
}
```

## API Endpoints

### POST /api/social/share
Share content on Farcaster.

**Request:**
```json
{
  "type": "market",
  "marketId": "123",
  "customText": "Optional custom text"
}
```

**Response:**
```json
{
  "success": true,
  "castHash": "0x...",
  "castUrl": "https://warpcast.com/~/conversations/0x..."
}
```

### GET /api/social/feed
Get follower activities.

**Query Parameters:**
- `fid`: User's Farcaster ID (required)
- `limit`: Number of activities to return (default: 25)

**Response:**
```json
{
  "activities": [
    {
      "id": "cast-hash",
      "type": "bet_placed",
      "user": {
        "fid": 123,
        "username": "alice",
        "displayName": "Alice",
        "pfpUrl": "https://..."
      },
      "market": {
        "id": "market-123",
        "title": "Market Title"
      },
      "details": {
        "amount": "1.0"
      },
      "timestamp": 1234567890,
      "castHash": "0x..."
    }
  ],
  "total": 10
}
```

## Deep Links

The social integration supports deep links for easy navigation:

- Market: `/markets/{marketId}`
- Bet: `/markets/{marketId}?outcome={outcomeId}`
- Profile: `/profile/{fid}`
- Leaderboard: `/leaderboard`

## Farcaster Frames

Markets automatically generate Farcaster Frame metadata for rich previews when shared on Warpcast.

Frame metadata includes:
- OG image with market details
- Interactive buttons (View Market, Place Bet, Share)
- Deep links to the app

## Configuration

Required environment variables:

```env
NEYNAR_API_KEY=your_neynar_api_key
FARCASTER_SIGNER_UUID=your_signer_uuid
NEXT_PUBLIC_APP_URL=https://your-app-url.com
```

## Notes

- All share buttons require a configured Farcaster signer
- Social feed requires Neynar API access
- Frame images are generated dynamically using Next.js OG image generation
- Deep links work both in-app and from external sources
