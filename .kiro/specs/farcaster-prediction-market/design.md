# Design Document - Farcaster Prediction Market

## Overview

Farcaster Prediction Market, Base blockchain üzerinde çalışan, Farcaster Mini App olarak entegre edilmiş merkezi olmayan bir tahmin piyasası platformudur. Uygulama, kullanıcıların sosyal olaylar ve trendler hakkında tahminlerde bulunmasını, bahis yapmasını ve doğru tahminlerden kazanç elde etmesini sağlar.

## Developer Setup & Prerequisites

### Prerequisites

Projeyi çalıştırmak için aşağıdaki araçların sisteminizde kurulu olması gerekmektedir:

- **Node.js** 18+ (LTS önerilir)
- **pnpm** veya **npm** (package manager)
- **Git** (version control)
- **Docker** (opsiyonel - local Postgres/Redis için)
- **PostgreSQL** 14+ (local veya remote)
- **Redis** 6+ (caching ve pub/sub için)
- **Hardhat** (smart contract development)
- **MetaMask** veya **Coinbase Wallet** (testing için)

### Quick Start Guide

#### 1. Repository Clone

```bash
git clone <repository-url>
cd farcaster-prediction-market
```

#### 2. Dependencies Installation

```bash
# npm kullanarak
npm install

# veya pnpm kullanarak
pnpm install
```

#### 3. Environment Variables Setup

`.env.example` dosyasını kopyalayın ve gerekli değerleri doldurun:

```bash
cp .env.example .env
```

Doldurulması gereken kritik değerler:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NEXT_PUBLIC_BASE_RPC_URL` - Base RPC endpoint
- `PRIVATE_KEY` - Contract deployment için wallet private key
- `JWT_SECRET` - Authentication için secret key
- `NEYNAR_API_KEY` - Farcaster integration için
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect için

#### 4. Local Services Setup

**Option A: Docker ile (Önerilen)**

```bash
# PostgreSQL
docker run --name pm-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=prediction_market \
  -p 5432:5432 \
  -d postgres:14

# Redis
docker run --name pm-redis \
  -p 6379:6379 \
  -d redis:7
```

**Option B: Manuel kurulum**

PostgreSQL ve Redis'i sisteminize manuel olarak kurun veya managed service kullanın (Supabase, Upstash, vb.)

#### 5. Database Migration

```bash
# Prisma schema'yı database'e uygula
npx prisma migrate dev --name init

# Prisma Client'ı generate et
npx prisma generate
```

#### 6. Development Server

```bash
# Frontend ve API'yi başlat
npm run dev

# Uygulama http://localhost:3000 adresinde çalışacak
```

#### 7. Smart Contract Development

```bash
# Hardhat local node başlat (ayrı terminal)
npx hardhat node

# Contract'ları compile et
npx hardhat compile

# Test'leri çalıştır
npx hardhat test

# Base Sepolia'ya deploy et
npx hardhat run --network baseSepolia scripts/deploy.ts

# Base Mainnet'e deploy et
npx hardhat run --network base scripts/deploy.ts
```

### External Services Setup

#### Alchemy / QuickNode (RPC Provider)

1. [Alchemy](https://www.alchemy.com/) veya [QuickNode](https://www.quicknode.com/) hesabı oluşturun
2. Yeni bir app oluşturun ve **Base** ve **Base Sepolia** network'lerini seçin
3. API endpoint URL'lerini kopyalayın
4. `.env` dosyasına ekleyin:
   ```
   NEXT_PUBLIC_BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
   NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
   ```

#### BaseScan API Key

1. [BaseScan](https://basescan.org/) hesabı oluşturun
2. API Keys bölümünden yeni bir key oluşturun
3. `.env` dosyasına ekleyin:
   ```
   BASESCAN_API_KEY=your_basescan_api_key
   ```

#### WalletConnect Project ID

1. [WalletConnect Cloud](https://cloud.walletconnect.com/) hesabı oluşturun
2. Yeni bir proje oluşturun
3. Project ID'yi kopyalayın
4. `.env` dosyasına ekleyin:
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

#### Neynar API Key (Farcaster)

1. [Neynar](https://neynar.com/) hesabı oluşturun
2. Dashboard'dan API key oluşturun
3. `.env` dosyasına ekleyin:
   ```
   NEYNAR_API_KEY=your_neynar_api_key
   ```

#### Farcaster Developer Setup

1. [Farcaster Developer Portal](https://warpcast.com/~/developers) ziyaret edin
2. Yeni bir app oluşturun
3. Signer UUID ve diğer credentials'ı alın
4. `.env` dosyasına ekleyin:
   ```
   FARCASTER_SIGNER_UUID=your_signer_uuid
   ```

### Common Issues & Troubleshooting

#### Database Connection Error

```
Error: Can't reach database server at localhost:5432
```

**Çözüm:**
- PostgreSQL'in çalıştığından emin olun: `docker ps` veya `pg_isready`
- `DATABASE_URL` değerinin doğru olduğunu kontrol edin
- Firewall ayarlarını kontrol edin

#### Wallet Wrong Network

```
Error: Chain mismatch. Expected 8453, got 1
```

**Çözüm:**
- Wallet'ınızı Base network'üne switch edin
- MetaMask'ta: Networks → Add Network → Base
- Chain ID: 8453 (mainnet) veya 84532 (sepolia)

#### Insufficient Funds (Testnet)

```
Error: Insufficient funds for gas
```

**Çözüm:**
- Base Sepolia faucet kullanın: [Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- Bridged ETH alın: [Base Bridge](https://bridge.base.org/)

#### Contract Deployment Failed

```
Error: Transaction reverted without a reason string
```

**Çözüm:**
- Gas limit'i artırın
- Constructor parametrelerini kontrol edin
- `PRIVATE_KEY` ve `OWNER_ADDRESS` değerlerinin doğru olduğunu kontrol edin
- RPC endpoint'in çalıştığını test edin

#### Farcaster Auth Failed

```
Error: Failed to initialize Farcaster SDK
```

**Çözüm:**
- `FARCASTER_SIGNER_UUID` değerinin doğru olduğunu kontrol edin
- Farcaster developer portal'da app'in aktif olduğunu kontrol edin
- CORS ayarlarını kontrol edin

### Development Workflow

1. **Feature Development**
   - Yeni bir branch oluşturun: `git checkout -b feature/your-feature`
   - Kod yazın ve test edin
   - Commit yapın: `git commit -m "feat: your feature"`

2. **Testing**
   - Unit tests: `npm run test`
   - E2E tests: `npm run test:e2e`
   - Contract tests: `npx hardhat test`

3. **Code Quality**
   - Linting: `npm run lint`
   - Type checking: `npm run type-check`
   - Formatting: `npm run format`

4. **Deployment**
   - Staging: Vercel preview deployment (automatic on PR)
   - Production: Merge to main branch (automatic deployment)

### Temel Teknoloji Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS (styling)
- Farcaster SDK (@farcaster/frame-sdk)
- wagmi + viem (Web3 interactions)
- Zustand (state management)
- React Query (data fetching)
- Socket.io-client (real-time updates)

**Backend:**
- Next.js API Routes
- Vercel KV (Redis-based caching & sessions)
- Socket.io (WebSocket server - optional for real-time)

**Blockchain:**
- Solidity 0.8.x
- Hardhat (development & testing)
- Base Mainnet / Base Sepolia (testnet)
- OpenZeppelin Contracts (security)

**Infrastructure:**
- Vercel (hosting + KV storage)
- Alchemy / QuickNode (RPC provider)

## Architecture

### High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A[Farcaster Mini App]
        B[Web Interface]
    end
    
    subgraph "Application Layer"
        C[Next.js Frontend]
        D[API Routes]
        E[WebSocket Server]
    end
    
    subgraph "Data Layer"
        F[Vercel KV Cache]
    end
    
    subgraph "Blockchain Layer"
        I[Base Network]
        J[Smart Contracts]
        K[RPC Provider]
    end
    
    subgraph "External Services"
        L[Farcaster Hub]
        M[Wallet Providers]
    end
    
    A --> C
    B --> C
    C --> D
    C --> E
    D --> F
    E --> F
    D --> K
    K --> I
    I --> J
    C --> L
    C --> M
```

### System Flow

**1. Kullanıcı Kimlik Doğrulama Akışı:**
```
User → Farcaster SDK → Farcaster Hub → Verify FID → Store Session → Redirect to App
```

**2. Piyasa Oluşturma Akışı:**
```
User Input → Validation → Smart Contract Call → Transaction Confirmation → Database Update → WebSocket Broadcast
```

**3. Bahis Yapma Akışı:**
```
Select Outcome → Enter Amount → Calculate Odds → Wallet Approval → Smart Contract Call → Update AMM → Database Update → Real-time Broadcast
```

**4. Sonuçlandırma Akışı:**
```
Market Expires → Creator Resolves → Smart Contract Update → Calculate Winnings → Update Database → Notify Winners
```

## Components and Interfaces

### Frontend Components

#### 1. Authentication Components
```typescript
// components/auth/FarcasterAuth.tsx
interface FarcasterAuthProps {
  onSuccess: (user: FarcasterUser) => void;
  onError: (error: Error) => void;
}

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
}
```

#### 2. Wallet Components
```typescript
// components/wallet/WalletConnect.tsx
interface WalletConnectProps {
  requiredChainId: number;
  onConnect: (address: string) => void;
}

// components/wallet/WalletBalance.tsx
interface WalletBalanceProps {
  address: string;
  showActions?: boolean;
}
```

#### 3. Market Components
```typescript
// components/market/MarketCard.tsx
interface MarketCardProps {
  market: Market;
  onClick: () => void;
  showStats?: boolean;
}

// components/market/MarketDetail.tsx
interface MarketDetailProps {
  marketId: string;
  userAddress?: string;
}

// components/market/CreateMarketForm.tsx
interface CreateMarketFormProps {
  onSuccess: (marketId: string) => void;
  onCancel: () => void;
}
```

#### 4. Betting Components
```typescript
// components/betting/BetModal.tsx
interface BetModalProps {
  market: Market;
  outcome: Outcome;
  onConfirm: (amount: bigint) => Promise<void>;
  onClose: () => void;
}

// components/betting/OddsDisplay.tsx
interface OddsDisplayProps {
  outcomes: Outcome[];
  totalPool: bigint;
  realtime?: boolean;
}
```

#### 5. Profile Components
```typescript
// components/profile/UserProfile.tsx
interface UserProfileProps {
  fid: number;
  isOwnProfile: boolean;
}

// components/profile/BetHistory.tsx
interface BetHistoryProps {
  userId: string;
  filter: 'active' | 'completed';
}

// components/profile/Statistics.tsx
interface StatisticsProps {
  userId: string;
}
```

#### 6. Leaderboard Components
```typescript
// components/leaderboard/Leaderboard.tsx
interface LeaderboardProps {
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time';
  limit?: number;
}
```

### Backend API Endpoints

#### Authentication APIs
```typescript
// /api/auth/farcaster
POST /api/auth/farcaster
Body: { fid: number, signature: string, message: string }
Response: { token: string, user: User }

// /api/auth/session
GET /api/auth/session
Response: { user: User | null }
```

#### Market APIs
```typescript
// /api/markets
GET /api/markets?category=&status=&search=&sort=
Response: { markets: Market[], total: number }

POST /api/markets
Body: { title, description, outcomes, endTime, category }
Response: { marketId: string, txHash: string }

// /api/markets/[id]
GET /api/markets/[id]
Response: { market: Market, outcomes: Outcome[], bets: Bet[] }

PATCH /api/markets/[id]/resolve
Body: { winningOutcomeId: string }
Response: { success: boolean, txHash: string }

DELETE /api/markets/[id]
Response: { success: boolean }
```

#### Betting APIs
```typescript
// /api/bets
POST /api/bets
Body: { marketId, outcomeId, amount }
Response: { betId: string, txHash: string, newOdds: Odds }

// /api/bets/user/[fid]
GET /api/bets/user/[fid]?status=active
Response: { bets: Bet[] }
```

#### Winnings APIs
```typescript
// /api/winnings/[userId]
GET /api/winnings/[userId]
Response: { claimable: bigint, claimed: bigint, pending: bigint }

POST /api/winnings/claim
Body: { userId: string }
Response: { amount: bigint, txHash: string }
```

#### Analytics APIs
```typescript
// /api/analytics/leaderboard
GET /api/analytics/leaderboard?timeframe=weekly
Response: { users: LeaderboardEntry[] }

// /api/analytics/platform
GET /api/analytics/platform
Response: { totalVolume, activeUsers, totalMarkets, fees }
```

#### Social APIs
```typescript
// /api/social/share
POST /api/social/share
Body: { marketId, platform: 'farcaster' }
Response: { castHash: string, url: string }

// /api/social/feed
GET /api/social/feed?fid=123
Response: { activities: Activity[] }
```

### Smart Contract Interfaces

#### PredictionMarket.sol (Main Contract)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPredictionMarket {
    struct Market {
        uint256 id;
        address creator;
        string title;
        uint256 endTime;
        uint256 totalPool;
        MarketStatus status;
        uint256 winningOutcome;
        uint256 creationFee;
    }
    
    struct Outcome {
        uint256 id;
        uint256 marketId;
        string name;
        uint256 totalBets;
        uint256 liquidity;
    }
    
    struct Bet {
        uint256 id;
        uint256 marketId;
        uint256 outcomeId;
        address bettor;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
    }
    
    enum MarketStatus {
        Active,
        Closed,
        Resolved,
        Cancelled,
        Disputed
    }
    
    // Events
    event MarketCreated(uint256 indexed marketId, address indexed creator, uint256 endTime);
    event BetPlaced(uint256 indexed marketId, uint256 indexed outcomeId, address indexed bettor, uint256 amount);
    event MarketResolved(uint256 indexed marketId, uint256 winningOutcome);
    event WinningsClaimed(address indexed user, uint256 amount);
    event MarketCancelled(uint256 indexed marketId);
    event DisputeRaised(uint256 indexed marketId, address indexed disputer);
    
    // Core Functions
    function createMarket(
        string memory title,
        string[] memory outcomeNames,
        uint256 endTime
    ) external payable returns (uint256 marketId);
    
    function placeBet(
        uint256 marketId,
        uint256 outcomeId
    ) external payable;
    
    function resolveMarket(
        uint256 marketId,
        uint256 winningOutcome
    ) external;
    
    function claimWinnings(uint256[] memory betIds) external;
    
    function cancelMarket(uint256 marketId) external;
    
    function raiseDispute(uint256 marketId, string memory reason) external;
    
    // View Functions
    function getMarket(uint256 marketId) external view returns (Market memory);
    
    function getOutcomes(uint256 marketId) external view returns (Outcome[] memory);
    
    function getUserBets(address user) external view returns (Bet[] memory);
    
    function calculatePotentialWinnings(
        uint256 marketId,
        uint256 outcomeId,
        uint256 betAmount
    ) external view returns (uint256);
    
    function getOdds(uint256 marketId) external view returns (uint256[] memory);
}
```

#### AMMLibrary.sol (Automated Market Maker)
```solidity
library AMMLibrary {
    // Constant product formula: x * y = k
    function calculateOdds(
        uint256 totalPool,
        uint256 outcomeLiquidity,
        uint256 numOutcomes
    ) internal pure returns (uint256);
    
    function calculateNewLiquidity(
        uint256 currentLiquidity,
        uint256 betAmount,
        uint256 totalPool
    ) internal pure returns (uint256);
    
    function calculateSlippage(
        uint256 betAmount,
        uint256 currentLiquidity
    ) internal pure returns (uint256);
    
    function calculatePlatformFee(
        uint256 amount,
        uint256 feePercentage
    ) internal pure returns (uint256);
}
```

#### FeeManager.sol
```solidity
interface IFeeManager {
    function setCreationFee(uint256 newFee) external;
    function setPlatformFeePercentage(uint256 newPercentage) external;
    function withdrawFees() external;
    function getAccumulatedFees() external view returns (uint256);
}
```

## Data Models

### Vercel KV Data Structure

Vercel KV (Redis-based) kullanarak minimal veri saklama:

```typescript
// lib/kv/types.ts

// Session data (JWT alternative)
interface UserSession {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  walletAddress?: string;
  expiresAt: number;
}

// Cached Farcaster user data
interface CachedUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
  cachedAt: number;
}

// Cached market list (from blockchain)
interface CachedMarket {
  marketId: string;
  title: string;
  description: string;
  category: string;
  creator: string;
  endTime: number;
  status: number;
  totalPool: string;
  participantCount: number;
  outcomes: CachedOutcome[];
  cachedAt: number;
}

interface CachedOutcome {
  outcomeId: number;
  name: string;
  totalBets: string;
  odds: number;
}

// User's active bets cache
interface CachedUserBets {
  marketId: string;
  outcomeId: number;
  amount: string;
  timestamp: number;
}

// KV Keys Structure:
// - session:{fid} → UserSession (TTL: 24h)
// - user:{fid} → CachedUser (TTL: 1h)
// - markets:list → CachedMarket[] (TTL: 5min)
// - market:{id} → CachedMarket (TTL: 5min)
// - user:{fid}:bets → CachedUserBets[] (TTL: 5min)
// - odds:{marketId} → number[] (TTL: 30s)
```

### Vercel KV Helper Functions

```typescript
// lib/kv/index.ts
import { kv } from '@vercel/kv';

// Session management
export async function setUserSession(fid: number, session: UserSession) {
  await kv.set(`session:${fid}`, session, { ex: 86400 }); // 24h
}

export async function getUserSession(fid: number): Promise<UserSession | null> {
  return await kv.get(`session:${fid}`);
}

export async function deleteUserSession(fid: number) {
  await kv.del(`session:${fid}`);
}

// User cache
export async function cacheUser(user: CachedUser) {
  await kv.set(`user:${user.fid}`, user, { ex: 3600 }); // 1h
}

export async function getCachedUser(fid: number): Promise<CachedUser | null> {
  return await kv.get(`user:${fid}`);
}

// Market cache
export async function cacheMarkets(markets: CachedMarket[]) {
  await kv.set('markets:list', markets, { ex: 300 }); // 5min
}

export async function getCachedMarkets(): Promise<CachedMarket[] | null> {
  return await kv.get('markets:list');
}

export async function cacheMarket(marketId: string, market: CachedMarket) {
  await kv.set(`market:${marketId}`, market, { ex: 300 }); // 5min
}

export async function getCachedMarket(marketId: string): Promise<CachedMarket | null> {
  return await kv.get(`market:${marketId}`);
}

export async function invalidateMarketCache(marketId?: string) {
  await kv.del('markets:list');
  if (marketId) {
    await kv.del(`market:${marketId}`);
  }
}

// User bets cache
export async function cacheUserBets(fid: number, bets: CachedUserBets[]) {
  await kv.set(`user:${fid}:bets`, bets, { ex: 300 }); // 5min
}

export async function getCachedUserBets(fid: number): Promise<CachedUserBets[] | null> {
  return await kv.get(`user:${fid}:bets`);
}

// Odds cache (very short TTL for real-time feel)
export async function cacheOdds(marketId: string, odds: number[]) {
  await kv.set(`odds:${marketId}`, odds, { ex: 30 }); // 30s
}

export async function getCachedOdds(marketId: string): Promise<number[] | null> {
  return await kv.get(`odds:${marketId}`);
}
```

### TypeScript Types

```typescript
// types/market.ts
export interface Market {
  id: string;
  chainId: number;
  contractAddress: string;
  marketId: bigint;
  title: string;
  description: string;
  category: string;
  creator: User;
  endTime: Date;
  status: MarketStatus;
  totalPool: bigint;
  participantCount: number;
  winningOutcome?: number;
  outcomes: Outcome[];
  createdAt: Date;
  txHash: string;
}

export interface Outcome {
  id: string;
  outcomeId: number;
  name: string;
  totalBets: bigint;
  liquidity: bigint;
  odds: number;
}

export interface Bet {
  id: string;
  market: Market;
  outcome: Outcome;
  user: User;
  amount: bigint;
  potentialWinnings: bigint;
  claimed: boolean;
  txHash: string;
  createdAt: Date;
}

export type MarketStatus = 
  | 'ACTIVE' 
  | 'CLOSED' 
  | 'PENDING_RESOLUTION' 
  | 'RESOLVED' 
  | 'CANCELLED' 
  | 'DISPUTED';

export interface CreateMarketInput {
  title: string;
  description: string;
  outcomes: string[];
  endTime: Date;
  category: string;
}

export interface PlaceBetInput {
  marketId: string;
  outcomeId: number;
  amount: bigint;
}
```

## Error Handling

### Error Types and Handling Strategy

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
  }
}

export class BlockchainError extends AppError {
  constructor(message: string, details?: any) {
    super('BLOCKCHAIN_ERROR', message, 500, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super('AUTH_ERROR', message, 401);
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(required: bigint, available: bigint) {
    super(
      'INSUFFICIENT_BALANCE',
      `Insufficient balance. Required: ${required}, Available: ${available}`,
      400,
      { required, available }
    );
  }
}

export class MarketClosedError extends AppError {
  constructor(marketId: string) {
    super(
      'MARKET_CLOSED',
      `Market ${marketId} is closed for betting`,
      400,
      { marketId }
    );
  }
}
```

### Error Handling Middleware

```typescript
// middleware/errorHandler.ts
export function errorHandler(error: Error, req: Request, res: Response) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }
  
  // Blockchain errors
  if (error.message.includes('user rejected')) {
    return res.status(400).json({
      error: {
        code: 'USER_REJECTED',
        message: 'Transaction was rejected by user'
      }
    });
  }
  
  // Generic error
  console.error('Unhandled error:', error);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
}
```

### Frontend Error Display

```typescript
// components/ErrorBoundary.tsx
export function ErrorDisplay({ error }: { error: AppError }) {
  const errorMessages = {
    BLOCKCHAIN_ERROR: 'Blockchain işlemi başarısız oldu. Lütfen tekrar deneyin.',
    INSUFFICIENT_BALANCE: 'Yetersiz bakiye. Lütfen cüzdanınıza ETH ekleyin.',
    MARKET_CLOSED: 'Bu piyasa bahis almaya kapalı.',
    AUTH_ERROR: 'Lütfen giriş yapın.',
    VALIDATION_ERROR: 'Girdiğiniz bilgileri kontrol edin.',
  };
  
  return (
    <div className="error-toast">
      <p>{errorMessages[error.code] || error.message}</p>
      {error.details && <pre>{JSON.stringify(error.details, null, 2)}</pre>}
    </div>
  );
}
```

## Testing Strategy

### Unit Tests

**Smart Contracts (Hardhat + Chai)**
```typescript
// test/PredictionMarket.test.ts
describe("PredictionMarket", () => {
  it("should create a market with correct parameters");
  it("should accept bets and update odds");
  it("should prevent betting after market closes");
  it("should resolve market and calculate winnings correctly");
  it("should handle platform fees correctly");
  it("should prevent reentrancy attacks");
  it("should allow market cancellation with refunds");
});
```

**Backend APIs (Jest)**
```typescript
// __tests__/api/markets.test.ts
describe("Markets API", () => {
  it("GET /api/markets returns paginated markets");
  it("POST /api/markets creates market and returns ID");
  it("PATCH /api/markets/[id]/resolve updates market status");
  it("handles invalid market creation data");
});
```

**Frontend Components (Jest + React Testing Library)**
```typescript
// __tests__/components/MarketCard.test.tsx
describe("MarketCard", () => {
  it("renders market information correctly");
  it("displays correct odds for each outcome");
  it("shows time remaining until market closes");
  it("handles click events");
});
```

### Integration Tests

```typescript
// __tests__/integration/betting-flow.test.ts
describe("Complete Betting Flow", () => {
  it("user can create market, place bet, and claim winnings", async () => {
    // 1. Create market
    // 2. Place bet
    // 3. Resolve market
    // 4. Claim winnings
    // 5. Verify balances
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/market-creation.spec.ts
test("complete market creation flow", async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="create-market"]');
  await page.fill('[name="title"]', 'Test Market');
  // ... fill form
  await page.click('[data-testid="submit"]');
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### Test Coverage Goals
- Smart Contracts: 100% (critical for security)
- Backend APIs: 90%
- Frontend Components: 80%
- Integration Tests: Key user flows covered

## Security Considerations

### Smart Contract Security

1. **Reentrancy Protection**: OpenZeppelin's ReentrancyGuard
2. **Access Control**: Ownable pattern for admin functions
3. **Integer Overflow**: Solidity 0.8.x built-in checks
4. **Front-running Protection**: Commit-reveal scheme for sensitive operations
5. **Emergency Pause**: Circuit breaker pattern
6. **Audit**: Third-party security audit before mainnet deployment

### Backend Security

1. **Authentication**: JWT tokens with short expiration
2. **Rate Limiting**: Prevent API abuse
3. **Input Validation**: Zod schemas for all inputs
4. **SQL Injection**: Prisma ORM parameterized queries
5. **CORS**: Restricted to allowed origins
6. **Environment Variables**: Sensitive data in .env

### Frontend Security

1. **XSS Protection**: React's built-in escaping
2. **CSRF Protection**: SameSite cookies
3. **Wallet Security**: Never request private keys
4. **Transaction Verification**: Always show transaction details before signing

## Performance Optimization

### Frontend Optimization

1. **Code Splitting**: Dynamic imports for routes
2. **Image Optimization**: Next.js Image component
3. **Caching**: React Query with stale-while-revalidate
4. **Lazy Loading**: Intersection Observer for lists
5. **Bundle Size**: Tree shaking and minification

### Backend Optimization

1. **Database Indexing**: Indexes on frequently queried fields
2. **Query Optimization**: Prisma select only needed fields
3. **Caching**: Redis for frequently accessed data
4. **Connection Pooling**: Prisma connection pool
5. **CDN**: Static assets served via CDN

### Blockchain Optimization

1. **Gas Optimization**: Efficient Solidity patterns
2. **Batch Operations**: Combine multiple operations
3. **Event Indexing**: Use events for historical data
4. **RPC Caching**: Cache blockchain reads

## Deployment Strategy

### Development Environment
- Base Sepolia testnet
- Local PostgreSQL
- Local Redis
- Vercel preview deployments

### Staging Environment
- Base Sepolia testnet
- Managed PostgreSQL (Supabase/Neon)
- Managed Redis (Upstash)
- Vercel staging deployment

### Production Environment
- Base Mainnet
- Managed PostgreSQL with replicas
- Managed Redis cluster
- Vercel production deployment
- Monitoring: Sentry, DataDog
- Analytics: PostHog, Dune Analytics

## Vercel Deployment Guide

### Step 1: Vercel Project Setup

1. **Vercel hesabı oluşturun**: https://vercel.com/signup
2. **GitHub repository'nizi bağlayın**
3. **Import project** butonuna tıklayın
4. **Framework Preset**: Next.js (otomatik algılanır)
5. **Root Directory**: `.` (default)
6. **Build Command**: `npm run build` (default)
7. **Output Directory**: `.next` (default)

### Step 2: Environment Variables Configuration

Vercel dashboard'da **Settings → Environment Variables** bölümünden ekleyin:

```bash
# Base Network
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key

# Smart Contracts (Production'da Base Mainnet adresleri)
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0x...
OWNER_ADDRESS=0x...
PRIVATE_KEY=your_private_key

# Farcaster
FARCASTER_HUB_URL=https://hub.farcaster.xyz
NEYNAR_API_KEY=your_neynar_api_key
FARCASTER_SIGNER_UUID=your_signer_uuid
NEXT_PUBLIC_APP_URL=https://your-production-domain.vercel.app

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Database (Managed PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/prediction_market

# Redis (Managed Redis)
REDIS_URL=redis://default:password@host:6379

# JWT
JWT_SECRET=your_secure_jwt_secret

# Monitoring
SENTRY_DSN=your_sentry_dsn

# Optional
PAYMASTER_URL=
```

**Environment Scope:**
- **Production**: Production branch (main) için
- **Preview**: Pull request'ler için
- **Development**: Local development için

### Step 3: vercel.json Configuration

Proje root'unda `vercel.json` oluşturun:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://your-domain.vercel.app"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

### Step 4: Database Setup (Production)

#### Option A: Supabase

1. https://supabase.com/ hesabı oluşturun
2. Yeni proje oluşturun
3. **Database → Connection String** bölümünden connection string'i kopyalayın
4. Vercel'de `DATABASE_URL` olarak ekleyin
5. Connection pooling için: **Database → Connection Pooling** → Transaction mode

#### Option B: Neon

1. https://neon.tech/ hesabı oluşturun
2. Yeni proje oluşturun
3. Connection string'i kopyalayın
4. Vercel'de `DATABASE_URL` olarak ekleyin

#### Option C: Railway

1. https://railway.app/ hesabı oluşturun
2. PostgreSQL service ekleyin
3. Connection string'i kopyalayın
4. Vercel'de `DATABASE_URL` olarak ekleyin

#### Database Migration

```bash
# Production database'e migration uygula
DATABASE_URL="your_production_db_url" npx prisma migrate deploy

# Prisma Client generate et
npx prisma generate
```

### Step 5: Redis Setup (Production)

#### Upstash Redis

1. https://upstash.com/ hesabı oluşturun
2. Yeni Redis database oluşturun
3. **Details** bölümünden connection string'i kopyalayın
4. Vercel'de `REDIS_URL` olarak ekleyin

```bash
# Format: redis://default:password@host:port
REDIS_URL=redis://default:xxxxx@us1-xxxxx.upstash.io:6379
```

### Step 6: Smart Contract Deployment to Base Mainnet

```bash
# 1. Base Mainnet RPC provider setup (Alchemy örneği)
# https://dashboard.alchemy.com/ → Create App → Base Mainnet

# 2. Deployment wallet'a ETH transfer et
# Base Bridge kullanarak: https://bridge.base.org/

# 3. .env dosyasını güncelle
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key
OWNER_ADDRESS=your_wallet_address

# 4. Contract'ları deploy et
npx hardhat run --network base scripts/deploy.ts

# 5. Contract address'leri kaydet
# Output: PredictionMarket deployed to: 0x...

# 6. BaseScan'de verify et
npx hardhat verify --network base DEPLOYED_ADDRESS "constructor_args"

# 7. Contract address'leri Vercel'e ekle
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0x...
```

### Step 7: Farcaster App Registration

1. **Manifest dosyasını güncelle** (`public/farcaster.json`):

```json
{
  "name": "Prediction Market",
  "version": "1.0.0",
  "description": "Decentralized prediction market on Base",
  "icon": "https://your-domain.vercel.app/icon.png",
  "homeUrl": "https://your-domain.vercel.app",
  "imageUrl": "https://your-domain.vercel.app/preview.png",
  "buttonTitle": "Open App",
  "splashImageUrl": "https://your-domain.vercel.app/splash.png",
  "splashBackgroundColor": "#0f172a",
  "webhookUrl": "https://your-domain.vercel.app/api/webhooks/farcaster"
}
```

2. **App assets hazırla**:
   - `icon.png` (512x512)
   - `preview.png` (1200x630)
   - `splash.png` (1080x1920)

3. **Farcaster Developer Portal**:
   - https://warpcast.com/~/developers ziyaret edin
   - "Create App" butonuna tıklayın
   - Manifest URL'i girin: `https://your-domain.vercel.app/farcaster.json`
   - App'i submit edin

4. **Test edin**:
   - Warpcast'te app'i açın
   - Tüm fonksiyonları test edin

### Step 8: CI/CD Pipeline Setup

`.github/workflows/deploy.yml` oluşturun:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Step 9: Monitoring Setup

#### Sentry Error Tracking

```bash
# 1. Sentry hesabı oluştur: https://sentry.io/
# 2. Next.js projesi oluştur
# 3. Sentry wizard çalıştır
npx @sentry/wizard@latest -i nextjs

# 4. SENTRY_DSN'i Vercel'e ekle
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

#### Vercel Analytics

```bash
# Vercel dashboard'da Analytics'i aktifleştir
# package.json'a ekle
npm install @vercel/analytics

# app/layout.tsx'a ekle
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Step 10: Production Launch Checklist

- [ ] Tüm environment variables Vercel'de ayarlandı
- [ ] Database migrations production'da çalıştırıldı
- [ ] Smart contracts Base Mainnet'e deploy edildi ve verify edildi
- [ ] Contract ownership doğru adrese transfer edildi
- [ ] Farcaster app manifest güncel ve erişilebilir
- [ ] Farcaster developer portal'da app onaylandı
- [ ] Monitoring ve error tracking aktif
- [ ] Custom domain bağlandı (opsiyonel)
- [ ] SSL certificate aktif
- [ ] Load testing yapıldı
- [ ] Backup stratejisi hazır
- [ ] Rollback planı dokümante edildi
- [ ] Security audit tamamlandı (önerilen)
- [ ] Launch announcement hazır (Farcaster cast)

### Deployment Commands

```bash
# Preview deployment (automatic on PR)
git checkout -b feature/my-feature
git push origin feature/my-feature
# Vercel otomatik preview deployment oluşturur

# Production deployment (automatic on merge to main)
git checkout main
git merge feature/my-feature
git push origin main
# Vercel otomatik production deployment yapar

# Manuel deployment (opsiyonel)
vercel --prod
```

### Rollback Strategy

```bash
# Vercel dashboard'da:
# 1. Deployments sekmesine git
# 2. Önceki başarılı deployment'ı bul
# 3. "..." menüsünden "Promote to Production" seç

# Veya CLI ile:
vercel rollback
```

### Post-Launch Monitoring

1. **Vercel Dashboard**: Deployment status, analytics, logs
2. **Sentry**: Error tracking ve performance monitoring
3. **BaseScan**: Smart contract transactions
4. **Database**: Query performance ve connection pool
5. **Redis**: Cache hit rate ve memory usage

### Deployment Checklist
1. Smart contract audit completed
2. All tests passing
3. Environment variables configured
4. Database migrations applied
5. Monitoring and alerts configured
6. Backup strategy in place
7. Rollback plan documented

## Monitoring and Observability

### Metrics to Track
- Transaction success/failure rates
- API response times
- Database query performance
- WebSocket connection stability
- Smart contract gas usage
- User engagement metrics
- Platform revenue

### Logging Strategy
- Structured logging (JSON format)
- Log levels: ERROR, WARN, INFO, DEBUG
- Centralized logging (DataDog/CloudWatch)
- Transaction tracing
- Error tracking (Sentry)

### Alerts
- Smart contract errors
- API downtime
- Database connection issues
- High gas prices
- Unusual transaction patterns
- Security incidents

## Base Blockchain Integration Details

### Base Network Configuration

```typescript
// config/chains.ts
import { base, baseSepolia } from 'viem/chains';

export const SUPPORTED_CHAINS = {
  production: base,
  development: baseSepolia
};

export const BASE_CONFIG = {
  mainnet: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    }
  },
  testnet: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    faucet: 'https://www.coinbase.com/faucets/base-ethereum-goerli-faucet'
  }
};
```

### Wagmi Configuration for Base

```typescript
// config/wagmi.ts
import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: 'Farcaster Prediction Market',
      appLogoUrl: 'https://your-app-url.com/logo.png',
      preference: 'smartWalletOnly', // Coinbase Smart Wallet için
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
      metadata: {
        name: 'Farcaster Prediction Market',
        description: 'Decentralized prediction market on Base',
        url: 'https://your-app-url.com',
        icons: ['https://your-app-url.com/icon.png']
      }
    })
  ],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL)
  }
});
```

### Smart Contract Deployment on Base

```typescript
// scripts/deploy.ts
import { ethers } from 'hardhat';

async function main() {
  console.log('Deploying to Base...');
  
  // Deploy PredictionMarket contract
  const PredictionMarket = await ethers.getContractFactory('PredictionMarket');
  const predictionMarket = await PredictionMarket.deploy(
    process.env.OWNER_ADDRESS,
    ethers.parseEther('0.001'), // Creation fee
    200 // Platform fee (2%)
  );
  
  await predictionMarket.waitForDeployment();
  const address = await predictionMarket.getAddress();
  
  console.log('PredictionMarket deployed to:', address);
  
  // Verify on BaseScan
  console.log('Verifying contract...');
  await run('verify:verify', {
    address: address,
    constructorArguments: [
      process.env.OWNER_ADDRESS,
      ethers.parseEther('0.001'),
      200
    ]
  });
}
```

### Hardhat Configuration for Base

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 84532,
      gasPrice: 1000000000 // 1 gwei
    },
    base: {
      url: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 8453,
      gasPrice: 'auto'
    }
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY!,
      baseSepolia: process.env.BASESCAN_API_KEY!
    },
    customChains: [
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org'
        }
      },
      {
        network: 'baseSepolia',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org'
        }
      }
    ]
  }
};

export default config;
```

## Farcaster Integration Details

### Farcaster SDK Setup

```typescript
// lib/farcaster.ts
import { FrameSDK } from '@farcaster/frame-sdk';

export const farcasterSDK = new FrameSDK({
  // SDK configuration
});

export async function initializeFarcaster() {
  try {
    const context = await farcasterSDK.context;
    return {
      user: context.user,
      location: context.location,
      client: context.client
    };
  } catch (error) {
    console.error('Failed to initialize Farcaster SDK:', error);
    throw error;
  }
}
```

### Farcaster Frame Configuration

```typescript
// app/layout.tsx - Frame metadata
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Farcaster Prediction Market',
  description: 'Decentralized prediction market on Base',
  openGraph: {
    title: 'Farcaster Prediction Market',
    description: 'Make predictions and earn rewards',
    images: ['/og-image.png']
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://your-app-url.com/frame-image.png',
    'fc:frame:button:1': 'Open App',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://your-app-url.com'
  }
};
```

### Farcaster Authentication Flow

```typescript
// lib/auth/farcaster.ts
import { createAppClient, viemConnector } from '@farcaster/auth-client';

export const farcasterAuthClient = createAppClient({
  relay: 'https://relay.farcaster.xyz',
  ethereum: viemConnector()
});

export async function authenticateWithFarcaster() {
  const {
    channelToken,
    url,
    message,
    signature,
    nonce
  } = await farcasterAuthClient.createChannel({
    siweUri: 'https://your-app-url.com',
    domain: 'your-app-url.com'
  });
  
  // Show QR code or deep link
  return { channelToken, url };
}

export async function verifyFarcasterAuth(channelToken: string) {
  const { data, error } = await farcasterAuthClient.watchStatus({
    channelToken,
    timeout: 60000,
    interval: 1000
  });
  
  if (error) throw error;
  
  // Verify signature and get user data
  return {
    fid: data.fid,
    username: data.username,
    displayName: data.displayName,
    pfpUrl: data.pfpUrl,
    custody: data.custody
  };
}
```

### Farcaster Hub API Integration

```typescript
// lib/farcaster/hub.ts
import axios from 'axios';

const FARCASTER_HUB_URL = process.env.FARCASTER_HUB_URL || 'https://hub.farcaster.xyz';

export async function getUserByFid(fid: number) {
  const response = await axios.get(`${FARCASTER_HUB_URL}/v1/userDataByFid`, {
    params: { fid }
  });
  return response.data;
}

export async function getCastsByFid(fid: number, limit = 10) {
  const response = await axios.get(`${FARCASTER_HUB_URL}/v1/castsByFid`, {
    params: { fid, limit }
  });
  return response.data;
}

export async function getFollowersByFid(fid: number) {
  const response = await axios.get(`${FARCASTER_HUB_URL}/v1/linksByFid`, {
    params: { fid, link_type: 'follow' }
  });
  return response.data;
}
```

### Farcaster Cast (Post) Integration

```typescript
// lib/farcaster/cast.ts
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export async function publishCast(params: {
  signerUuid: string;
  text: string;
  embeds?: { url: string }[];
  channelId?: string;
}) {
  try {
    const cast = await neynarClient.publishCast(
      params.signerUuid,
      params.text,
      {
        embeds: params.embeds,
        channelId: params.channelId
      }
    );
    return cast;
  } catch (error) {
    console.error('Failed to publish cast:', error);
    throw error;
  }
}

export async function sharePredictionMarket(marketId: string, marketTitle: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const text = `🎯 New prediction market: ${marketTitle}\n\nPlace your bets now!`;
  
  return publishCast({
    signerUuid: process.env.FARCASTER_SIGNER_UUID!,
    text,
    embeds: [{ url: `${appUrl}/markets/${marketId}` }]
  });
}
```

### Farcaster Frames for Market Sharing

```typescript
// app/api/frames/market/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFrameHtml } from '@coinbase/onchainkit/frame';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const market = await getMarket(params.id);
  
  const frameHtml = getFrameHtml({
    image: `${process.env.NEXT_PUBLIC_APP_URL}/api/og/market/${params.id}`,
    buttons: [
      {
        label: 'View Market',
        action: 'link',
        target: `${process.env.NEXT_PUBLIC_APP_URL}/markets/${params.id}`
      },
      {
        label: 'Place Bet',
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/bet/${params.id}`
      }
    ],
    postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/market/${params.id}`,
  });
  
  return new NextResponse(frameHtml, {
    headers: { 'Content-Type': 'text/html' }
  });
}
```

### Environment Variables Setup

```bash
# .env.example

# Base Network
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key

# Smart Contracts
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0x...
OWNER_ADDRESS=0x...
PRIVATE_KEY=your_private_key

# Farcaster
FARCASTER_HUB_URL=https://hub.farcaster.xyz
NEYNAR_API_KEY=your_neynar_api_key
FARCASTER_SIGNER_UUID=your_signer_uuid
NEXT_PUBLIC_APP_URL=https://your-app-url.com

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Vercel KV (automatically added by Vercel)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# JWT
JWT_SECRET=your_jwt_secret

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

### Farcaster Mini App Manifest

```json
// public/farcaster.json
{
  "name": "Prediction Market",
  "version": "1.0.0",
  "description": "Decentralized prediction market on Base",
  "icon": "https://your-app-url.com/icon.png",
  "homeUrl": "https://your-app-url.com",
  "imageUrl": "https://your-app-url.com/preview.png",
  "buttonTitle": "Open App",
  "splashImageUrl": "https://your-app-url.com/splash.png",
  "splashBackgroundColor": "#000000",
  "webhookUrl": "https://your-app-url.com/api/webhooks/farcaster"
}
```

### Coinbase Smart Wallet Integration (Base Native)

```typescript
// lib/wallet/coinbase.ts
import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';

export const coinbaseWallet = new CoinbaseWalletSDK({
  appName: 'Farcaster Prediction Market',
  appLogoUrl: 'https://your-app-url.com/logo.png',
  darkMode: true,
  overrideIsMetaMask: false,
  reloadOnDisconnect: false
});

export const coinbaseProvider = coinbaseWallet.makeWeb3Provider({
  options: 'smartWalletOnly', // Force Smart Wallet
  chainId: 8453 // Base Mainnet
});
```

### Farcaster Mini App Context & Actions

```typescript
// lib/farcaster/context.ts
import sdk from '@farcaster/frame-sdk';

export async function getFarcasterContext() {
  const context = await sdk.context;
  
  return {
    user: {
      fid: context.user.fid,
      username: context.user.username,
      displayName: context.user.displayName,
      pfpUrl: context.user.pfpUrl
    },
    location: context.location, // Where the frame is being viewed
    client: {
      clientFid: context.client.clientFid,
      added: context.client.added // Is app added to user's apps
    }
  };
}

// Farcaster Actions
export async function openUrl(url: string) {
  await sdk.actions.openUrl(url);
}

export async function close() {
  await sdk.actions.close();
}

export async function ready() {
  await sdk.actions.ready();
}

// Usage in component
export function MarketDetailPage() {
  useEffect(() => {
    // Notify Farcaster that the frame is ready
    ready();
  }, []);

  const handleShareOnFarcaster = async () => {
    const shareUrl = `${window.location.origin}/markets/${marketId}`;
    await openUrl(`https://warpcast.com/~/compose?text=Check out this prediction market!&embeds[]=${encodeURIComponent(shareUrl)}`);
  };

  return (
    <button onClick={handleShareOnFarcaster}>
      Share on Farcaster
    </button>
  );
}
```

### Farcaster Frame Server-Side Rendering

```typescript
// app/api/frames/market/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFrameMetadata } from '@coinbase/onchainkit/frame';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const market = await prisma.market.findUnique({
    where: { id: params.id },
    include: { outcomes: true }
  });

  if (!market) {
    return new NextResponse('Market not found', { status: 404 });
  }

  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        label: `Bet on ${market.outcomes[0].name}`,
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/bet/${market.id}/0`
      },
      {
        label: `Bet on ${market.outcomes[1].name}`,
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/bet/${market.id}/1`
      },
      {
        label: 'View Details',
        action: 'link',
        target: `${process.env.NEXT_PUBLIC_APP_URL}/markets/${market.id}`
      }
    ],
    image: {
      src: `${process.env.NEXT_PUBLIC_APP_URL}/api/og/market/${market.id}`,
      aspectRatio: '1.91:1'
    },
    postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/market/${market.id}`
  });

  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        ${Object.entries(frameMetadata)
          .map(([key, value]) => `<meta property="${key}" content="${value}" />`)
          .join('\n        ')}
      </head>
      <body>
        <h1>${market.title}</h1>
      </body>
    </html>`,
    {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=60'
      }
    }
  );
}

// Handle frame button clicks
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { untrustedData } = body;

  // Verify the frame message
  const { isValid, message } = await validateFrameMessage(body);
  
  if (!isValid) {
    return new NextResponse('Invalid frame message', { status: 400 });
  }

  // Process the action based on button clicked
  const buttonIndex = untrustedData.buttonIndex;
  
  // Return updated frame
  return NextResponse.json({
    // Updated frame data
  });
}
```

### Dynamic OG Image Generation for Frames

```typescript
// app/api/og/market/[id]/route.tsx
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const market = await getMarket(params.id);

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#0f172a',
          padding: '40px',
          fontFamily: 'Inter'
        }}
      >
        <div style={{ display: 'flex', fontSize: 48, fontWeight: 'bold', color: 'white' }}>
          {market.title}
        </div>
        <div style={{ display: 'flex', marginTop: 20, fontSize: 24, color: '#94a3b8' }}>
          {market.description}
        </div>
        <div style={{ display: 'flex', marginTop: 'auto', gap: 20 }}>
          {market.outcomes.map((outcome) => (
            <div
              key={outcome.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                flex: 1
              }}
            >
              <div style={{ fontSize: 20, color: 'white' }}>{outcome.name}</div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#3b82f6', marginTop: 10 }}>
                {calculateOdds(outcome)}x
              </div>
              <div style={{ fontSize: 16, color: '#64748b', marginTop: 5 }}>
                {formatEther(outcome.totalBets)} ETH
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
```

### Base Gasless Transactions (Paymaster)

```typescript
// lib/paymaster.ts
import { createPublicClient, createWalletClient, http } from 'viem';
import { base } from 'viem/chains';

export async function sendGaslessTransaction(params: {
  to: string;
  data: string;
  value?: bigint;
}) {
  const paymasterUrl = process.env.PAYMASTER_URL;
  
  if (!paymasterUrl) {
    throw new Error('Paymaster not configured');
  }
  
  // Use Coinbase Paymaster or similar service
  const response = await fetch(paymasterUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'pm_sponsorUserOperation',
      params: [params]
    })
  });
  
  const { result } = await response.json();
  return result;
}
```

## Testing & Verification Guide

### Local Testing with Hardhat

#### Running Local Node

```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts to local node
npx hardhat run --network localhost scripts/deploy.ts

# Run tests
npx hardhat test

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test

# Run tests with coverage
npx hardhat coverage
```

#### Forked Network Testing

Test against a fork of Base mainnet or Sepolia:

```bash
# Fork Base mainnet
npx hardhat node --fork https://mainnet.base.org

# Fork Base Sepolia
npx hardhat node --fork https://sepolia.base.org

# Run tests on forked network
npx hardhat test --network localhost
```

### Contract Verification on BaseScan

#### Automatic Verification

```bash
# Verify on Base Sepolia
npx hardhat verify --network baseSepolia DEPLOYED_CONTRACT_ADDRESS "constructor" "arguments"

# Verify on Base Mainnet
npx hardhat verify --network base DEPLOYED_CONTRACT_ADDRESS "constructor" "arguments"
```

#### Manual Verification

1. BaseScan'e gidin: https://basescan.org/verifyContract
2. Contract address'i girin
3. Compiler version'ı seçin (0.8.20)
4. Optimization enabled: Yes, runs: 200
5. Contract source code'u yapıştırın
6. Constructor arguments'ı ABI-encoded format'ta girin

### Gas Optimization Testing

```typescript
// test/gas-optimization.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Gas Optimization Tests", () => {
  it("should measure gas for market creation", async () => {
    const tx = await predictionMarket.createMarket(
      "Test Market",
      ["Yes", "No"],
      futureTimestamp,
      { value: ethers.parseEther("0.001") }
    );
    const receipt = await tx.wait();
    console.log("Gas used for market creation:", receipt.gasUsed.toString());
    expect(receipt.gasUsed).to.be.lt(500000); // Should be under 500k gas
  });

  it("should measure gas for placing bet", async () => {
    const tx = await predictionMarket.placeBet(marketId, 0, {
      value: ethers.parseEther("0.1")
    });
    const receipt = await tx.wait();
    console.log("Gas used for placing bet:", receipt.gasUsed.toString());
    expect(receipt.gasUsed).to.be.lt(200000); // Should be under 200k gas
  });
});
```

### Integration Testing

```typescript
// __tests__/integration/full-flow.test.ts
describe("Complete User Flow", () => {
  it("should complete full betting cycle", async () => {
    // 1. User authenticates with Farcaster
    const authResponse = await request(app)
      .post('/api/auth/farcaster')
      .send({ fid: 12345, signature: 'mock_signature' });
    
    expect(authResponse.status).toBe(200);
    const token = authResponse.body.token;

    // 2. User connects wallet
    const walletResponse = await request(app)
      .post('/api/wallet/connect')
      .set('Authorization', `Bearer ${token}`)
      .send({ address: '0x...' });
    
    expect(walletResponse.status).toBe(200);

    // 3. User creates market
    const marketResponse = await request(app)
      .post('/api/markets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Market',
        description: 'Test Description',
        outcomes: ['Yes', 'No'],
        endTime: new Date(Date.now() + 86400000),
        category: 'Sports'
      });
    
    expect(marketResponse.status).toBe(201);
    const marketId = marketResponse.body.marketId;

    // 4. Another user places bet
    const betResponse = await request(app)
      .post('/api/bets')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        marketId,
        outcomeId: 0,
        amount: ethers.parseEther("0.1").toString()
      });
    
    expect(betResponse.status).toBe(201);

    // 5. Market resolves
    const resolveResponse = await request(app)
      .patch(`/api/markets/${marketId}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ winningOutcomeId: 0 });
    
    expect(resolveResponse.status).toBe(200);

    // 6. Winner claims winnings
    const claimResponse = await request(app)
      .post('/api/winnings/claim')
      .set('Authorization', `Bearer ${token2}`);
    
    expect(claimResponse.status).toBe(200);
    expect(claimResponse.body.amount).to.be.gt(0);
  });
});
```

## Wallet Integration Best Practices

### Deep Linking for Mobile Wallets

```typescript
// lib/wallet/deeplink.ts
export function generateWalletDeepLink(
  walletType: 'metamask' | 'coinbase' | 'rainbow',
  action: 'connect' | 'sign',
  params?: Record<string, string>
): string {
  const baseUrls = {
    metamask: 'https://metamask.app.link',
    coinbase: 'https://go.cb-w.com',
    rainbow: 'https://rnbwapp.com'
  };

  const url = new URL(baseUrls[walletType]);
  url.searchParams.append('action', action);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  return url.toString();
}

// Usage in component
function WalletConnectButton() {
  const handleMobileConnect = () => {
    const deepLink = generateWalletDeepLink('coinbase', 'connect', {
      redirect: window.location.href,
      chainId: '8453'
    });
    window.location.href = deepLink;
  };

  return (
    <button onClick={handleMobileConnect}>
      Connect Coinbase Wallet
    </button>
  );
}
```

### QR Code Flow for Desktop

```typescript
// components/wallet/QRCodeConnect.tsx
import QRCode from 'qrcode.react';
import { useWalletConnect } from '@/hooks/useWalletConnect';

export function QRCodeConnect() {
  const { uri, isConnecting } = useWalletConnect();

  if (!uri) return null;

  return (
    <div className="qr-container">
      <h3>Scan with your mobile wallet</h3>
      <QRCode value={uri} size={256} />
      <p>Waiting for connection...</p>
    </div>
  );
}
```

### Error Handling Examples

```typescript
// lib/wallet/errors.ts
export class WalletError extends Error {
  constructor(
    public code: WalletErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

export enum WalletErrorCode {
  USER_REJECTED = 'USER_REJECTED',
  WRONG_NETWORK = 'WRONG_NETWORK',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  CONNECTION_FAILED = 'CONNECTION_FAILED'
}

// Usage
export async function connectWallet() {
  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    return accounts[0];
  } catch (error: any) {
    if (error.code === 4001) {
      throw new WalletError(
        WalletErrorCode.USER_REJECTED,
        'User rejected the connection request'
      );
    }
    throw new WalletError(
      WalletErrorCode.CONNECTION_FAILED,
      'Failed to connect wallet',
      error
    );
  }
}

// Component error display
function WalletErrorDisplay({ error }: { error: WalletError }) {
  const messages = {
    [WalletErrorCode.USER_REJECTED]: 'Bağlantı isteğini reddettiniz.',
    [WalletErrorCode.WRONG_NETWORK]: 'Lütfen Base ağına geçin.',
    [WalletErrorCode.INSUFFICIENT_FUNDS]: 'Yetersiz bakiye.',
    [WalletErrorCode.WALLET_NOT_FOUND]: 'Wallet bulunamadı. Lütfen yükleyin.',
    [WalletErrorCode.CONNECTION_FAILED]: 'Bağlantı başarısız. Tekrar deneyin.'
  };

  return (
    <div className="error-message">
      {messages[error.code] || error.message}
    </div>
  );
}
```

### Network Switching Helper

```typescript
// lib/wallet/network.ts
import { base, baseSepolia } from 'viem/chains';

export async function switchToBaseNetwork(isTestnet = false) {
  const targetChain = isTestnet ? baseSepolia : base;
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${targetChain.id.toString(16)}` }]
    });
  } catch (error: any) {
    // Chain not added, add it
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${targetChain.id.toString(16)}`,
          chainName: targetChain.name,
          nativeCurrency: targetChain.nativeCurrency,
          rpcUrls: [targetChain.rpcUrls.default.http[0]],
          blockExplorerUrls: [targetChain.blockExplorers.default.url]
        }]
      });
    } else {
      throw error;
    }
  }
}
```

## Future Enhancements

### Phase 2 Features
- Multi-token support (USDC, DAI)
- Liquidity provider rewards
- Advanced charting and analytics
- Mobile native app
- Oracle integration for automated resolution

### Phase 3 Features
- Cross-chain markets (Optimism, Arbitrum)
- Governance token
- DAO for dispute resolution
- Market templates
- API for third-party integrations

---

Bu design dokümanı, Farcaster Prediction Market uygulamasının teknik mimarisini, bileşenlerini, veri modellerini, güvenlik stratejilerini ve özellikle Base blockchain ile Farcaster entegrasyonu için gerekli tüm ayarları detaylı olarak açıklamaktadır. Implementation aşamasında bu dokümana referans verilerek geliştirme yapılacaktır.
