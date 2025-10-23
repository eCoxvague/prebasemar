# 🎯 Farcaster Prediction Market

A decentralized prediction market built on Base blockchain, integrated as a Farcaster Mini App. Users can create markets, place bets, and earn rewards from accurate predictions.

## 🌟 Features

- **Decentralized Markets**: Create prediction markets on any topic
- **Base Blockchain**: Low gas fees and fast transactions
- **Farcaster Integration**: Seamless social features and authentication
- **AMM-based Odds**: Automated market maker for dynamic odds
- **Smart Wallet Support**: Coinbase Smart Wallet integration
- **Real-time Updates**: Live odds and market updates

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Blockchain**: Solidity, Hardhat, Base (L2)
- **Web3**: wagmi, viem
- **Cache**: Vercel KV (Redis-based)
- **Deployment**: Vercel
- **Social**: Farcaster SDK

## 📚 Documentation

- [Getting Started](docs/getting-started.md) - Setup and installation
- [Base Integration](docs/base-integration.md) - Base blockchain deployment
- [Wallets Guide](docs/wallets.md) - Wallet integration
- [Design Document](.kiro/specs/farcaster-prediction-market/design.md) - Architecture and technical design
- [Requirements](.kiro/specs/farcaster-prediction-market/requirements.md) - Feature requirements
- [Tasks](.kiro/specs/farcaster-prediction-market/tasks.md) - Implementation roadmap

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/eCoxvague/prebasemar.git
cd prebasemar

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Setup Vercel KV (in Vercel dashboard)
# Add environment variables

# Run development server
npm run dev
```

## 📋 Project Structure

```
prebasemar/
├── .kiro/specs/           # Project specifications
│   └── farcaster-prediction-market/
│       ├── design.md      # Technical design
│       ├── requirements.md # Feature requirements
│       └── tasks.md       # Implementation tasks
├── docs/                  # Documentation
│   ├── getting-started.md
│   ├── base-integration.md
│   └── wallets.md
├── public/
│   └── farcaster.json    # Farcaster Mini App manifest
└── .env.example          # Environment variables template
```

## 🔧 Environment Variables

See `.env.example` for required environment variables:

- Base RPC URLs (Alchemy/QuickNode)
- Smart contract addresses
- Farcaster API keys
- WalletConnect project ID
- Vercel KV credentials (auto-added)

## 📦 Implementation Status

**Current Phase**: MVP Development

- ✅ Project specifications complete
- ✅ Design document complete
- ✅ Task list ready
- 🚧 Smart contracts (in progress)
- 🚧 Frontend development (in progress)
- ⏳ Deployment (pending)

See [tasks.md](.kiro/specs/farcaster-prediction-market/tasks.md) for detailed progress.

## 🎯 MVP Features

- Market creation and listing
- Betting with dynamic odds (AMM)
- Market resolution
- Winnings claim
- Basic user profile
- Farcaster authentication
- Social sharing

## 🔮 Phase 2 Features

- Leaderboard and rankings
- Detailed analytics
- Notification system
- Dispute mechanism
- Advanced search and filters
- Social activity feed

## 🤝 Contributing

This is currently a private project. Contributions will be opened after MVP launch.

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Farcaster](https://www.farcaster.xyz/)
- [Base](https://base.org/)
- [Vercel](https://vercel.com/)

## 📞 Contact

For questions or support, reach out via Farcaster or GitHub issues.

---

Built with ❤️ on Base
