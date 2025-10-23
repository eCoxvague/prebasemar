# Betting Components

This directory contains React components for the betting functionality of the Farcaster Prediction Market application.

## Components

### BetModal

A modal dialog component for placing bets on market outcomes.

**Props:**
- `market: CachedMarket` - The market to bet on
- `outcome: CachedOutcome` - The selected outcome
- `onConfirm: (amount: bigint) => Promise<void>` - Callback when bet is confirmed
- `onClose: () => void` - Callback to close the modal
- `userBalance?: bigint` - User's wallet balance (optional)

**Features:**
- Amount input with validation
- Real-time odds display (auto-refresh every 5s)
- Potential winnings calculation
- Slippage display
- Balance check with MAX button
- Loading states and error handling
- Responsive design

**Usage:**
```tsx
import { BetModal } from '@/components/betting';

<BetModal
  market={market}
  outcome={selectedOutcome}
  userBalance={balance}
  onConfirm={async (amount) => {
    await placeBet({ marketId, outcomeId, amount });
  }}
  onClose={() => setShowModal(false)}
/>
```

### OddsDisplay

A component that displays all outcomes with their current odds and allows users to click to bet.

**Props:**
- `marketId: string` - The market ID
- `outcomes: CachedOutcome[]` - Array of market outcomes
- `onOutcomeClick?: (outcome: CachedOutcome) => void` - Callback when outcome is clicked
- `realtime?: boolean` - Enable real-time updates (default: false)
- `refreshInterval?: number` - Refresh interval in ms (default: 30000)

**Features:**
- Visual representation of bet distribution
- Real-time updates (configurable)
- Manual refresh button
- Color-coded odds
- Progress bars showing relative bet amounts
- Click to bet functionality

**Usage:**
```tsx
import { OddsDisplay } from '@/components/betting';

<OddsDisplay
  marketId={market.marketId}
  outcomes={market.outcomes}
  realtime={true}
  refreshInterval={30000}
  onOutcomeClick={(outcome) => {
    setSelectedOutcome(outcome);
    setShowBetModal(true);
  }}
/>
```

## Integration Example

Here's a complete example of integrating betting into a market detail page:

```tsx
'use client';

import { useState } from 'react';
import { BetModal, OddsDisplay } from '@/components/betting';
import { usePlaceBet } from '@/lib/hooks/usePlaceBet';
import { useWallet } from '@/lib/hooks/useWallet';

export default function MarketPage({ market }) {
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [showBetModal, setShowBetModal] = useState(false);
  const { balance } = useWallet();
  const { placeBet } = usePlaceBet();

  return (
    <div>
      <OddsDisplay
        marketId={market.marketId}
        outcomes={market.outcomes}
        realtime={true}
        onOutcomeClick={(outcome) => {
          setSelectedOutcome(outcome);
          setShowBetModal(true);
        }}
      />

      {showBetModal && selectedOutcome && (
        <BetModal
          market={market}
          outcome={selectedOutcome}
          userBalance={balance}
          onConfirm={async (amount) => {
            const result = await placeBet({
              marketId: market.marketId,
              outcomeId: selectedOutcome.outcomeId,
              amount,
            });

            if (result.success) {
              setShowBetModal(false);
              // Refresh market data
            }
          }}
          onClose={() => {
            setShowBetModal(false);
            setSelectedOutcome(null);
          }}
        />
      )}
    </div>
  );
}
```

## Styling

All components use Tailwind CSS for styling and follow the application's design system:

- **Primary Color**: Blue (blue-600)
- **Success Color**: Green (green-600)
- **Error Color**: Red (red-600)
- **Warning Color**: Yellow (yellow-600)

## Accessibility

- All interactive elements are keyboard accessible
- Proper ARIA labels for screen readers
- Focus management in modals
- Color contrast meets WCAG AA standards

## Performance

- Odds auto-refresh is debounced
- Components use React.memo where appropriate
- Lazy loading for heavy calculations
- Optimistic UI updates

## Error Handling

All components handle errors gracefully:
- Network errors
- Validation errors
- Transaction errors
- User rejection

Errors are displayed in user-friendly language with actionable suggestions.
