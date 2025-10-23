# Smart Contracts Overview

This document provides an overview of all smart contracts in the Farcaster Prediction Market.

## Contracts

### 1. PredictionMarket.sol
**Main contract for the prediction market platform**

**Key Features:**
- Market creation with customizable outcomes (2-5 options)
- Betting mechanism with automatic pool management
- Market resolution by creator
- Winnings claim functionality
- Market cancellation (if no bets placed)
- Dispute mechanism
- Pausable for emergency situations
- Reentrancy protection

**Key Functions:**
- `createMarket(title, outcomeNames, endTime)` - Create a new market
- `placeBet(marketId, outcomeId)` - Place a bet on an outcome
- `resolveMarket(marketId, winningOutcomeId)` - Resolve market with winner
- `claimWinnings(marketId)` - Claim winnings from resolved market
- `cancelMarket(marketId)` - Cancel market (no bets only)
- `raiseDispute(marketId, reason)` - Raise a dispute

**Security Features:**
- OpenZeppelin ReentrancyGuard
- OpenZeppelin Pausable
- OpenZeppelin Ownable
- Platform fee cap (5% maximum)
- Time-based market validation

### 2. AMMLibrary.sol
**Library for Automated Market Maker calculations**

**Key Features:**
- Constant product formula for odds calculation
- Liquidity management
- Slippage calculation
- Platform fee calculation
- Potential winnings calculation

**Key Functions:**
- `calculateOdds(totalPool, outcomeLiquidity, numOutcomes)` - Calculate odds
- `calculateNewLiquidity(currentLiquidity, betAmount, totalPool)` - Update liquidity
- `calculateSlippage(betAmount, currentLiquidity)` - Calculate slippage
- `calculatePlatformFee(amount, feePercentage)` - Calculate fees
- `calculatePotentialWinnings(betAmount, odds)` - Calculate potential returns
- `calculateProportionalWinnings(betAmount, totalWinningBets, prizePool)` - Distribute winnings

**Constants:**
- MIN_ODDS: 1.01x (101 basis points)
- MAX_ODDS: 100.00x (10000 basis points)
- PRECISION: 1e18

### 3. FeeManager.sol
**Manages platform fees and withdrawals**

**Key Features:**
- Configurable creation fee
- Configurable platform fee percentage (0-5%)
- Fee tracking per market and creator
- Owner-only fee withdrawal
- Emergency withdrawal function

**Key Functions:**
- `setCreationFee(newFee)` - Update creation fee (owner only)
- `setPlatformFeePercentage(newPercentage)` - Update platform fee (owner only)
- `collectCreationFee(marketId, creator)` - Collect creation fee
- `collectPlatformFee(marketId, totalPool)` - Collect platform fee
- `withdrawFees()` - Withdraw all accumulated fees (owner only)
- `withdrawFeesAmount(amount)` - Withdraw specific amount (owner only)
- `emergencyWithdraw()` - Emergency withdrawal (owner only)

**Configuration:**
- Default creation fee: 0.001 ETH
- Default platform fee: 2%
- Maximum platform fee: 5%

### 4. SecurityManager.sol
**Provides security features and emergency controls**

**Key Features:**
- Emergency mode activation/deactivation
- Admin role management
- Address blacklisting
- Rate limiting
- Circuit breaker pattern
- Pausable functionality

**Key Functions:**
- `activateEmergencyMode()` - Activate emergency mode (admin only)
- `deactivateEmergencyMode()` - Deactivate emergency mode (owner only)
- `addAdmin(admin)` - Add admin (owner only)
- `removeAdmin(admin)` - Remove admin (owner only)
- `blacklistAddress(account, reason)` - Blacklist address (admin only)
- `whitelistAddress(account)` - Remove from blacklist (admin only)
- `setMinActionInterval(interval)` - Set rate limit (owner only)
- `pause()` / `unpause()` - Pause/unpause contract (admin only)

**Security Features:**
- Multi-admin support
- Rate limiting (default: 1 second between actions)
- Emergency mode with automatic pause
- Blacklist functionality
- Owner cannot be blacklisted or removed as admin

## Contract Interactions

```
User → PredictionMarket.createMarket() → FeeManager.collectCreationFee()
User → PredictionMarket.placeBet() → AMMLibrary.calculateOdds()
Creator → PredictionMarket.resolveMarket() → FeeManager.collectPlatformFee()
User → PredictionMarket.claimWinnings() → Transfer ETH
Owner → FeeManager.withdrawFees() → Transfer ETH to owner
Admin → SecurityManager.pause() → PredictionMarket paused
```

## Deployment

### Prerequisites
1. Set environment variables in `.env`:
   - `PRIVATE_KEY` - Deployer wallet private key
   - `BASE_SEPOLIA_RPC_URL` - Base Sepolia RPC endpoint
   - `BASE_RPC_URL` - Base Mainnet RPC endpoint
   - `BASESCAN_API_KEY` - BaseScan API key for verification
   - `OWNER_ADDRESS` - Contract owner address

2. Ensure sufficient ETH in deployer wallet

### Deploy to Base Sepolia (Testnet)
```bash
npm run hardhat:deploy:sepolia
```

### Deploy to Base Mainnet
```bash
npm run hardhat:deploy:mainnet
```

### Verify Contracts
```bash
npx hardhat run scripts/verify.js --network baseSepolia
npx hardhat run scripts/verify.js --network base
```

## Testing

### Compile Contracts
```bash
npm run hardhat:compile
```

### Run Tests (when implemented)
```bash
npm run hardhat:test
```

### Local Development
```bash
# Start local Hardhat node
npm run hardhat:node

# Deploy to local network (in another terminal)
npx hardhat run scripts/deploy.js --network localhost
```

## Gas Optimization

The contracts are optimized for gas efficiency:
- Solidity 0.8.20 with optimizer enabled (200 runs)
- Efficient storage patterns
- Minimal external calls
- Batch operations where possible
- Event emission for off-chain indexing

## Security Considerations

1. **Reentrancy Protection**: All state-changing functions use ReentrancyGuard
2. **Access Control**: Owner and admin roles properly implemented
3. **Integer Overflow**: Solidity 0.8.x built-in checks
4. **Pausable**: Emergency pause functionality
5. **Fee Caps**: Maximum fee percentage enforced
6. **Input Validation**: All inputs validated
7. **Time Checks**: Market timing properly validated

## Audit Recommendations

Before mainnet deployment:
1. Professional security audit
2. Comprehensive test coverage
3. Testnet deployment and testing
4. Community review period
5. Bug bounty program

## Contract Addresses

After deployment, contract addresses will be saved in:
- `deployments/` directory (JSON files)
- `.env` file (NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS)

## Support

For issues or questions:
- Check deployment logs in `deployments/` directory
- Review transaction on BaseScan
- Check contract state using `scripts/interact.js`

## License

MIT License - See LICENSE file for details
