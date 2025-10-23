# Deployment Scripts

This directory contains scripts for deploying and managing smart contracts.

## Scripts

### deploy.js
Deploys all contracts to the specified network.

**Usage:**
```bash
# Deploy to Base Sepolia (testnet)
npm run hardhat:deploy:sepolia

# Deploy to Base Mainnet
npm run hardhat:deploy:mainnet

# Or use hardhat directly
npx hardhat run scripts/deploy.js --network baseSepolia
npx hardhat run scripts/deploy.js --network base
```

**What it does:**
- Deploys PredictionMarket contract
- Deploys FeeManager contract
- Deploys SecurityManager contract
- Saves deployment info to `deployments/` directory
- Updates `.env` file with contract addresses
- Provides verification commands

### verify.js
Verifies deployed contracts on BaseScan.

**Usage:**
```bash
# Verify on Base Sepolia
npx hardhat run scripts/verify.js --network baseSepolia

# Verify on Base Mainnet
npx hardhat run scripts/verify.js --network base
```

**Requirements:**
- Contracts must be deployed first
- `BASESCAN_API_KEY` must be set in `.env`

### interact.js
Interacts with deployed contracts to check state and test functionality.

**Usage:**
```bash
npx hardhat run scripts/interact.js --network baseSepolia
npx hardhat run scripts/interact.js --network base
```

**What it shows:**
- Contract addresses
- Current market count
- Fee configuration
- Accumulated fees
- Contract pause status
- Example usage code

## Prerequisites

Before deploying, ensure you have:

1. **Environment Variables** set in `.env`:
   ```
   PRIVATE_KEY=your_wallet_private_key
   BASE_SEPOLIA_RPC_URL=your_rpc_url
   BASE_RPC_URL=your_rpc_url
   BASESCAN_API_KEY=your_api_key
   OWNER_ADDRESS=your_owner_address
   ```

2. **Sufficient ETH** in your deployment wallet:
   - Base Sepolia: Get testnet ETH from [Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
   - Base Mainnet: Ensure you have real ETH for deployment

3. **RPC Provider** (Alchemy, QuickNode, or Infura):
   - Sign up for a provider
   - Create a Base project
   - Copy the RPC URL

## Deployment Flow

1. **Test Locally** (optional):
   ```bash
   npx hardhat node
   # In another terminal:
   npx hardhat run scripts/deploy.js --network localhost
   ```

2. **Deploy to Testnet**:
   ```bash
   npm run hardhat:deploy:sepolia
   ```

3. **Verify Contracts**:
   ```bash
   npx hardhat run scripts/verify.js --network baseSepolia
   ```

4. **Test Interactions**:
   ```bash
   npx hardhat run scripts/interact.js --network baseSepolia
   ```

5. **Deploy to Mainnet** (after thorough testing):
   ```bash
   npm run hardhat:deploy:mainnet
   npx hardhat run scripts/verify.js --network base
   ```

## Deployment Info

Deployment information is saved in the `deployments/` directory with the format:
```
deployments/
  ├── baseSepolia-1234567890.json
  └── base-1234567891.json
```

Each file contains:
- Network information
- Deployer address
- Contract addresses
- Configuration parameters
- Deployment timestamp

## Security Notes

- **Never commit** your `.env` file or private keys
- **Test thoroughly** on testnet before mainnet deployment
- **Verify contracts** on BaseScan for transparency
- **Use a hardware wallet** for mainnet deployments
- **Keep deployment info** backed up securely

## Troubleshooting

### Insufficient Funds
```
Error: insufficient funds for gas * price + value
```
**Solution:** Add more ETH to your deployment wallet

### Network Connection Error
```
Error: could not detect network
```
**Solution:** Check your RPC URL in `.env` and ensure it's accessible

### Verification Failed
```
Error: Already Verified
```
**Solution:** Contract is already verified, check BaseScan

### Gas Price Too High
**Solution:** Wait for lower gas prices or adjust gas settings in `hardhat.config.js`

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Base Documentation](https://docs.base.org/)
- [BaseScan](https://basescan.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
