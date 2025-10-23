const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting contract verification...");
  console.log("Network:", hre.network.name);

  // Get the latest deployment file
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    console.error("No deployments directory found. Please deploy contracts first.");
    process.exit(1);
  }

  const files = fs.readdirSync(deploymentsDir)
    .filter(f => f.startsWith(hre.network.name))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error(`No deployment found for network: ${hre.network.name}`);
    process.exit(1);
  }

  const latestDeployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, files[0]), "utf8")
  );

  console.log("Using deployment from:", files[0]);
  console.log("\nVerifying contracts...\n");

  // Verify PredictionMarket
  try {
    console.log("Verifying PredictionMarket...");
    await hre.run("verify:verify", {
      address: latestDeployment.contracts.PredictionMarket,
      constructorArguments: [],
    });
    console.log("✓ PredictionMarket verified");
  } catch (error) {
    console.log("PredictionMarket verification error:", error.message);
  }

  // Verify FeeManager
  try {
    console.log("\nVerifying FeeManager...");
    const creationFee = hre.ethers.parseEther(latestDeployment.configuration.creationFee);
    const platformFeePercentage = latestDeployment.configuration.platformFeePercentage;
    
    await hre.run("verify:verify", {
      address: latestDeployment.contracts.FeeManager,
      constructorArguments: [creationFee, platformFeePercentage],
    });
    console.log("✓ FeeManager verified");
  } catch (error) {
    console.log("FeeManager verification error:", error.message);
  }

  // Verify SecurityManager
  try {
    console.log("\nVerifying SecurityManager...");
    await hre.run("verify:verify", {
      address: latestDeployment.contracts.SecurityManager,
      constructorArguments: [],
    });
    console.log("✓ SecurityManager verified");
  } catch (error) {
    console.log("SecurityManager verification error:", error.message);
  }

  console.log("\n=== Verification Complete ===");
  console.log("Check contracts on BaseScan:");
  console.log(`PredictionMarket: https://${getBaseScanUrl()}/address/${latestDeployment.contracts.PredictionMarket}`);
  console.log(`FeeManager: https://${getBaseScanUrl()}/address/${latestDeployment.contracts.FeeManager}`);
  console.log(`SecurityManager: https://${getBaseScanUrl()}/address/${latestDeployment.contracts.SecurityManager}`);
}

function getBaseScanUrl() {
  if (hre.network.name === "baseSepolia") {
    return "sepolia.basescan.org";
  } else if (hre.network.name === "base") {
    return "basescan.org";
  }
  return "basescan.org";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
