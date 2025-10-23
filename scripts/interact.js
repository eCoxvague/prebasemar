const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Contract Interaction Script");
  console.log("Network:", hre.network.name);

  // Get the latest deployment
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const files = fs.readdirSync(deploymentsDir)
    .filter(f => f.startsWith(hre.network.name))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error(`No deployment found for network: ${hre.network.name}`);
    process.exit(1);
  }

  const deployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, files[0]), "utf8")
  );

  const [signer] = await hre.ethers.getSigners();
  console.log("Using account:", signer.address);

  // Get contract instances
  const predictionMarket = await hre.ethers.getContractAt(
    "PredictionMarket",
    deployment.contracts.PredictionMarket
  );

  const feeManager = await hre.ethers.getContractAt(
    "FeeManager",
    deployment.contracts.FeeManager
  );

  // Display contract info
  console.log("\n=== Contract Information ===");
  console.log("PredictionMarket:", deployment.contracts.PredictionMarket);
  console.log("FeeManager:", deployment.contracts.FeeManager);

  // Get contract state
  console.log("\n=== Contract State ===");
  
  const marketCounter = await predictionMarket.marketCounter();
  console.log("Total Markets Created:", marketCounter.toString());

  const creationFee = await predictionMarket.creationFee();
  console.log("Creation Fee:", hre.ethers.formatEther(creationFee), "ETH");

  const platformFeePercentage = await predictionMarket.platformFeePercentage();
  console.log("Platform Fee:", platformFeePercentage.toString() + "%");

  const accumulatedFees = await predictionMarket.accumulatedFees();
  console.log("Accumulated Fees:", hre.ethers.formatEther(accumulatedFees), "ETH");

  const isPaused = await predictionMarket.paused();
  console.log("Contract Paused:", isPaused);

  // Example: Create a test market (commented out)
  console.log("\n=== Example Usage ===");
  console.log("To create a market:");
  console.log(`
  const tx = await predictionMarket.createMarket(
    "Will ETH reach $5000 by end of 2024?",
    ["Yes", "No"],
    Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days from now
    { value: hre.ethers.parseEther("0.001") }
  );
  await tx.wait();
  `);

  console.log("\nTo place a bet:");
  console.log(`
  const tx = await predictionMarket.placeBet(
    0, // marketId
    0, // outcomeId
    { value: hre.ethers.parseEther("0.01") }
  );
  await tx.wait();
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
