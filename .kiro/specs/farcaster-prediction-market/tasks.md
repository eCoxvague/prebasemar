# Implementation Plan - Farcaster Prediction Market

Bu implementation plan, Farcaster Prediction Market uygulamasının adım adım geliştirilmesi için hazırlanmış görev listesidir. Her görev, önceki görevler üzerine inşa edilir ve test-driven development yaklaşımı ile ilerler.

## Task List

- [x] 1. Proje yapısı ve temel konfigürasyon
  - Next.js 14 projesi oluştur (App Router)
  - TypeScript, ESLint, Prettier konfigürasyonlarını ayarla
  - TailwindCSS kurulumu ve temel tema ayarları
  - Folder structure oluştur (app, components, lib, types, contracts, prisma)
  - _Requirements: 19.1, 19.2, 19.3_

- [x] 2. Vercel KV setup ve caching utilities
  - [x] 2.1 Vercel KV kurulumu
    - `@vercel/kv` package kurulumu
    - Vercel dashboard'da KV database oluştur
    - Environment variables otomatik eklenir
    - _Requirements: 19.4_
  - [x] 2.2 KV helper functions
    - `lib/kv/index.ts` oluştur
    - Session management functions (set/get/delete)
    - User cache functions
    - Market cache functions
    - Odds cache functions
    - _Requirements: 1.3, 1.4_

- [x] 3. Smart Contract geliştirme
  - [x] 3.1 Hardhat projesi kurulumu
    - Hardhat kurulumu ve konfigürasyonu
    - OpenZeppelin contracts kurulumu
    - Base network konfigürasyonları (mainnet ve sepolia)
    - TypeChain setup (contract type generation)
    - _Requirements: 11.1, 19.7_
  - [x] 3.2 PredictionMarket contract implementasyonu
    - Market struct ve enum tanımlamaları
    - Market creation fonksiyonu (createMarket)
    - Bet placement fonksiyonu (placeBet)
    - Market resolution fonksiyonu (resolveMarket)
    - Winnings claim fonksiyonu (claimWinnings)
    - Events tanımlamaları
    - _Requirements: 3.1-3.7, 5.1-5.8, 6.1-6.7, 7.1-7.7_
  - [x] 3.3 AMMLibrary implementasyonu
    - Odds calculation fonksiyonu (constant product formula)
    - Liquidity calculation fonksiyonu
    - Slippage calculation fonksiyonu
    - Platform fee calculation fonksiyonu
    - _Requirements: 14.1-14.7_
  - [x] 3.4 FeeManager implementasyonu
    - Fee management fonksiyonları
    - Owner-only access control
    - Fee withdrawal fonksiyonu
    - _Requirements: 12.1-12.7_
  - [x] 3.5 Security features implementasyonu
    - ReentrancyGuard entegrasyonu
    - Pausable pattern implementasyonu
    - Access control (Ownable)
    - Emergency functions
    - _Requirements: 11.1-11.7_
  - [x] 3.6 Smart contract unit testleri
    - Market creation test cases
    - Betting test cases
    - Resolution test cases
    - Fee calculation test cases
    - Security test cases (reentrancy, access control)
    - Gas optimization tests
    - _Requirements: 11.1-11.7_
  - [x] 3.7 Contract deployment scripts
    - Deployment script oluştur (Base Sepolia ve Mainnet için)
    - Verification script oluştur
    - Contract address'leri .env'e kaydet
    - _Requirements: 11.7, 19.7_

- [x] 4. Authentication ve kullanıcı yönetimi
  - [x] 4.1 Farcaster authentication implementasyonu
    - Farcaster SDK kurulumu ve konfigürasyonu
    - Authentication API endpoint'leri (/api/auth/farcaster)
    - Session management (Vercel KV)
    - Stateless auth with signature verification
    - _Requirements: 1.1-1.5_
  - [x] 4.2 User cache ve Farcaster Hub API
    - Farcaster Hub API entegrasyonu (user data fetch)
    - User data caching (Vercel KV, 1h TTL)
    - User profile API endpoint'leri
    - _Requirements: 1.1-1.5, 8.1-8.6_
  - [x] 4.3 Authentication UI components
    - FarcasterAuth component
    - Login/Logout buttons
    - User profile dropdown
    - Protected route wrapper
    - _Requirements: 1.1-1.5_

- [-] 5. Wallet entegrasyonu
  - [x] 5.1 Wagmi ve viem konfigürasyonu
    - Wagmi config oluştur (Base chains)
    - Wallet connectors setup (Coinbase, WalletConnect, Injected)
    - RPC provider konfigürasyonu
    - _Requirements: 2.1-2.6_
  - [x] 5.2 Wallet connection UI
    - WalletConnect component
    - Network switcher component
    - Wallet balance display
    - Disconnect button
    - _Requirements: 2.1-2.6_
  - [x] 5.3 Wallet state management
    - Zustand store oluştur (wallet state)
    - Connected wallet tracking
    - Balance tracking
    - Network validation
    - _Requirements: 2.1-2.6_
  - [x] 5.4 Transaction helpers
    - Transaction signing utilities
    - Gas estimation helpers
    - Error handling ve user feedback
    - Transaction status tracking
    - _Requirements: 10.1-10.7, 11.6-11.7_

- [x] 6. Market oluşturma ve listeleme
  - [x] 6.1 Market API endpoints (blockchain-first)
    - POST /api/markets (smart contract call + cache invalidation)
    - GET /api/markets (blockchain read + Vercel KV cache, 5min TTL)
    - GET /api/markets/[id] (blockchain read + cache)
    - PATCH /api/markets/[id]/resolve (smart contract call)
    - DELETE /api/markets/[id] (smart contract call)
    - _Requirements: 3.1-3.7, 4.1-4.6, 6.1-6.7_
  - [x] 6.2 Market creation form
    - CreateMarketForm component
    - Form validation (Zod schema)
    - Outcome input fields (2-5 outcomes)
    - Date/time picker for end time
    - Category selector
    - _Requirements: 3.1-3.7_
  - [x] 6.3 Market creation flow
    - Smart contract interaction (createMarket)
    - Transaction confirmation handling
    - Database record creation
    - Success/error feedback
    - _Requirements: 3.1-3.7, 10.1-10.7_
  - [x] 6.4 Market list page
    - MarketCard component
    - Market list with pagination
    - Filter controls (category, status, search)
    - Sort options
    - Empty state handling
    - _Requirements: 4.1-4.6_
  - [x] 6.5 Market detail page
    - MarketDetail component
    - Outcome display with odds
    - Participant count ve total pool
    - Time remaining countdown
    - Bet history list
    - _Requirements: 4.1-4.6, 5.1-5.8_

- [x] 7. Bahis (Betting) sistemi
  - [x] 7.1 Betting API endpoints (blockchain-first)
    - POST /api/bets (smart contract call + cache invalidation)
    - GET /api/bets/user/[fid] (blockchain read + cache)
    - Bet validation logic
    - _Requirements: 5.1-5.8_
  - [x] 7.2 AMM odds calculation
    - Odds calculation service (blockchain read)
    - Odds caching (Vercel KV, 30s TTL)
    - Slippage calculation
    - Potential winnings calculation
    - _Requirements: 14.1-14.7_
  - [x] 7.3 Bet placement UI
    - BetModal component
    - Amount input with validation
    - Odds display (cached with auto-refresh)
    - Potential winnings display
    - Confirmation dialog
    - _Requirements: 5.1-5.8_
  - [x] 7.4 Bet placement flow
    - Balance check
    - Smart contract interaction (placeBet)
    - Transaction confirmation
    - Cache invalidation (market, odds, user bets)
    - _Requirements: 5.1-5.8_

- [x] 8. Real-time updates (Opsiyonel - Phase 2)
  - [x] 8.1 Polling-based updates (MVP için yeterli)
    - Client-side polling (her 30s odds refresh)
    - Cache-based updates
    - Optimistic UI updates
    - _Requirements: 9.1-9.5_
  - [x] 8.2 WebSocket implementation (Phase 2)
    - Socket.io server setup (opsiyonel)
    - Vercel KV pub/sub kullanımı
    - Real-time odds broadcast
    - _Requirements: 9.1-9.5_

- [x] 9. Market resolution ve winnings
  - [x] 9.1 Market resolution API
    - Resolution endpoint implementation
    - Creator-only validation
    - Smart contract interaction (resolveMarket)
    - Winnings calculation
    - _Requirements: 6.1-6.7_
  - [x] 9.2 Resolution UI
    - Resolution button (creator only)
    - Outcome selection
    - Confirmation dialog
    - Success feedback
    - _Requirements: 6.1-6.7_
  - [x] 9.3 Winnings API
    - GET /api/winnings/[userId] (claimable amount)
    - POST /api/winnings/claim (claim winnings)
    - Winnings calculation logic
    - _Requirements: 7.1-7.7_
  - [x] 9.4 Winnings claim UI
    - Claimable winnings display
    - Claim button
    - Transaction handling
    - Success notification
    - _Requirements: 7.1-7.7_

- [x] 10. User profile (Basit versiyon - blockchain data)
  - [x] 10.1 Profile API endpoints (blockchain-first)
    - GET /api/users/[fid]/profile (Farcaster data + cached)
    - GET /api/users/[fid]/bets (blockchain read + cached)
    - Basit statistics (blockchain'den hesapla)
    - _Requirements: 8.1-8.6_
  - [x] 10.2 Profile page UI (Minimal)
    - UserProfile component (Farcaster data)
    - Active bets list (blockchain)
    - Claimable winnings (blockchain)
    - Basit stats (bet count, total wagered)
    - _Requirements: 8.1-8.6_

- [x] 11. Leaderboard ve analytics (Phase 2 - Database gerekli)
  - Leaderboard ve detaylı analytics için PostgreSQL gerekli
  - MVP'de bu özellikler olmayacak
  - Phase 2'de database eklendiğinde implement edilecek
  - _Requirements: 18.1-18.7 (Phase 2)_

- [ ] 12. Farcaster sosyal entegrasyon
  - [ ] 12.1 Farcaster cast API
    - Neynar SDK entegrasyonu
    - POST /api/social/share (market paylaşımı)
    - Cast publishing logic
    - _Requirements: 15.1-15.7_
  - [ ] 12.2 Farcaster Frames
    - Frame metadata generation
    - Frame image generation (OG images)
    - Frame button handlers
    - Frame validation
    - _Requirements: 15.1-15.7_
  - [ ] 12.3 Social feed
    - GET /api/social/feed (follower activities)
    - Activity aggregation
    - Feed display component
    - _Requirements: 15.4_
  - [ ] 12.4 Share buttons
    - Share on Farcaster button
    - Share bet button
    - Share win button
    - Deep link generation
    - _Requirements: 15.1-15.7_

- [ ]\* 13. Dispute ve cancellation sistemi (Phase 2)
  - [ ]\* 13.1 Market cancellation (Basit versiyon)
    - Smart contract cancellation function
    - Cancellation UI (creator only, no bets)
    - Refund processing
    - _Requirements: 13.1-13.2_
  - [ ]\* 13.2 Dispute system (Phase 2 - Database gerekli)
    - Dispute tracking için database gerekli
    - Phase 2'de implement edilecek
    - _Requirements: 13.3-13.7 (Phase 2)_

- [ ]\* 14. Notifications sistemi (Phase 2 - Database gerekli)
  - Notification tracking ve history için database gerekli
  - MVP'de bu özellik olmayacak
  - Phase 2'de implement edilecek
  - _Requirements: 17.1-17.7 (Phase 2)_

- [ ] 15. Admin panel
  - [ ] 15.1 Admin authentication
    - Admin role check middleware
    - Admin-only routes
    - _Requirements: 12.4, 12.7_
  - [ ] 15.2 Fee management UI
    - Fee configuration panel
    - Fee withdrawal button
    - Accumulated fees display
    - _Requirements: 12.1-12.7_
  - [ ] 15.3 Dispute management
    - Pending disputes list
    - Dispute resolution actions
    - Market cancellation controls
    - _Requirements: 13.6-13.7_

- [ ] 16. Error handling ve logging
  - [ ] 16.1 Error handling middleware
    - Global error handler
    - Error types ve codes
    - User-friendly error messages
    - _Requirements: 10.1-10.7_
  - [ ] 16.2 Frontend error boundaries
    - React Error Boundary
    - Error display components
    - Retry mechanisms
    - _Requirements: 10.1-10.7_
  - [ ] 16.3 Logging setup
    - Structured logging (Winston/Pino)
    - Log levels configuration
    - Error tracking (Sentry)
    - _Requirements: 10.1-10.7_

- [ ] 17. Performance optimization
  - [ ] 17.1 Frontend optimization
    - Code splitting (dynamic imports)
    - Image optimization (Next.js Image)
    - React Query caching setup
    - Lazy loading components
    - _Requirements: 16.1-16.7_
  - [ ] 17.2 Backend optimization
    - Database query optimization
    - Redis caching implementation
    - API response caching
    - Connection pooling
    - _Requirements: 16.1-16.7_
  - [ ] 17.3 Blockchain optimization
    - RPC call caching
    - Batch RPC requests
    - Event indexing
    - _Requirements: 11.6_

- [ ] 18. Testing
  - [ ]\* 18.1 API integration tests
    - Authentication flow tests
    - Market CRUD tests
    - Betting flow tests
    - Winnings claim tests
    - _Requirements: All_
  - [ ]\* 18.2 Frontend component tests
    - Component rendering tests
    - User interaction tests
    - Form validation tests
    - _Requirements: All_
  - [ ]\* 18.3 E2E tests
    - Complete user journey tests
    - Market creation to resolution flow
    - Multi-user betting scenarios
    - _Requirements: All_

- [ ] 19. Documentation ve deployment
  - [ ] 19.1 API documentation
    - OpenAPI/Swagger documentation
    - API endpoint examples
    - Error codes documentation
    - _Requirements: 19.8_
  - [ ] 19.2 Vercel deployment setup
    - Vercel hesabı oluştur ve projeyi bağla
    - `vercel.json` konfigürasyon dosyası oluştur
    - Environment variables'ı Vercel dashboard'a ekle
    - Build settings konfigürasyonu (Next.js)
    - Preview deployments için branch stratejisi
    - Production domain ayarları
    - _Requirements: 19.1-19.8_
  - [ ] 19.3 Vercel KV production setup
    - Vercel dashboard'da KV database oluştur
    - Environment variables otomatik eklenir
    - Cache stratejisi test et
    - KV limits monitor et (256MB, 100K requests/ay)
    - _Requirements: 19.2_
  - [ ] 19.4 Smart contract Base Mainnet deployment
    - Base Mainnet RPC provider setup (Alchemy/QuickNode)
    - Deployment wallet'a yeterli ETH transfer et
    - Contract'ları Base Mainnet'e deploy et
    - BaseScan'de contract verification
    - Contract address'leri Vercel environment variables'a ekle
    - _Requirements: 11.1, 19.7_
  - [ ] 19.5 Base app registration ve manifest
    - `public/farcaster.json` manifest dosyasını güncelle
    - Production URL'leri ekle
    - App icon ve splash image'leri hazırla ve upload et
    - Farcaster developer portal'da app kaydı oluştur
    - App'i Farcaster'da test et
    - _Requirements: 15.1-15.7_
  - [ ] 19.6 CI/CD pipeline setup
    - GitHub Actions workflow oluştur
    - Automated tests (on PR)
    - Automated deployment (on merge to main)
    - Environment-specific deployments (staging/production)
    - _Requirements: 19.2_
  - [ ] 19.7 Monitoring ve analytics setup
    - Sentry error tracking entegrasyonu
    - Vercel Analytics aktifleştir
    - PostHog/Mixpanel analytics setup
    - Uptime monitoring (UptimeRobot/Pingdom)
    - Alert notifications setup (Discord/Slack)
    - _Requirements: 19.8_
  - [ ] 19.8 Production checklist ve launch
    - Tüm environment variables kontrolü
    - Database migrations production'da çalıştır
    - Smart contract ownership ve admin rights kontrolü
    - Security audit (opsiyonel ama önerilen)
    - Load testing
    - Backup ve rollback planı hazırla
    - Launch announcement (Farcaster'da paylaş)
    - _Requirements: 19.1-19.8_

---

## Implementation Notes

### Architecture: Blockchain-First + Vercel KV Cache

**Veri Akışı:**

```
User Action → Smart Contract (blockchain) → Cache Invalidation (Vercel KV)
                                                    ↓
User Query ← Vercel KV Cache (5min TTL) ← Blockchain (cache miss)
```

**Neden Bu Yaklaşım:**

- ✅ Basit: PostgreSQL complexity yok
- ✅ Hızlı: Cache sayesinde hızlı okuma
- ✅ Ucuz: Vercel KV free tier yeterli (256MB, 100K req/ay)
- ✅ Scalable: İleride PostgreSQL eklenebilir

### Task Execution Order

- Tasks should be executed in order as they build upon each other
- Sub-tasks marked with `*` are optional or Phase 2 features
- Each task should be completed and tested before moving to the next

### MVP vs Phase 2 Features

**MVP (Vercel KV Only):**

- ✅ Market creation & listing
- ✅ Betting & odds
- ✅ Market resolution
- ✅ Winnings claim
- ✅ Basic profile
- ✅ Farcaster share
- ✅ Session management

**Phase 2 (PostgreSQL Eklenince):**

- ⏳ Leaderboard & rankings
- ⏳ Detailed analytics
- ⏳ Notifications & history
- ⏳ Dispute tracking
- ⏳ Advanced search & filters
- ⏳ Social feed

### Testing Strategy

- Write tests for core functionality
- Optional test tasks can be skipped for MVP
- Integration tests are more valuable than unit tests for this project
- Focus on smart contract tests (100% coverage)

### Deployment Strategy

- Start with Base Sepolia testnet
- Thoroughly test all features
- Deploy to Base Mainnet after security audit

### Time Estimates (Güncellenmiş - Basitleştirilmiş)

- Tasks 1-3: ~1-2 days (Setup and smart contracts)
- Tasks 4-7: ~2-3 days (Core features)
- Tasks 8-10: ~1-2 days (Profile, real-time)
- Tasks 11-19: ~1-2 days (Social, admin, deployment)
- **Total: ~5-9 days** for MVP (database olmadan çok daha hızlı!)

### Priority Levels

- **P0 (Critical)**: Tasks 1-7, 9 (Core betting functionality)
- **P1 (High)**: Tasks 10, 12, 16, 19 (Profile, social, errors, deployment)
- **P2 (Medium)**: Tasks 15, 17 (Admin, optimization)
- **P3 (Low/Phase 2)**: Tasks 8, 11, 13, 14, 18 (Real-time, leaderboard, disputes, notifications, testing)

### Cache Strategy

**Vercel KV TTL'leri:**

- Sessions: 24 hours
- User profiles: 1 hour
- Market list: 5 minutes
- Market details: 5 minutes
- User bets: 5 minutes
- Odds: 30 seconds (real-time feel için)

**Cache Invalidation:**

- Market created → Invalidate market list
- Bet placed → Invalidate market, odds, user bets
- Market resolved → Invalidate market, user bets
- User updates → Invalidate user cache

### Migration Path to PostgreSQL (Phase 2)

Eğer ileride PostgreSQL'e geçmek isterseniz:

1. **Prisma schema ekle** (design.md'de hazır)
2. **Event listeners ekle** (blockchain → database sync)
3. **API'leri güncelle** (cache → database)
4. **Vercel KV'yi sadece cache için kullan**

Kod değişikliği minimal olacak çünkü API interface'leri aynı kalacak.
