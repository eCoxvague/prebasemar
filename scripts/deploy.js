const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");
  console.log("Network:", hre.network.name);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy PredictionMarket
  console.log("\nDeploying PredictionMarket...");
  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy();
  await predictionMarket.waitForDeployment();
  const predictionMarketAddress = await predictionMarket.getAddress();
  console.log("PredictionMarket deployed to:", predictionMarketAddress);

  // Deploy FeeManager
  console.log("\nDeploying FeeManager...");
  const creationFee = hre.ethers.parseEther("0.001"); // 0.001 ETH
  const platformFeePercentage = 2; // 2%
  
  const FeeManager = await hre.ethers.getContractFactory("FeeManager");
  const feeManager = await FeeManager.deploy(creationFee, platformFeePercentage);
  await feeManager.waitForDeployment();
  const feeManagerAddress = await feeManager.getAddress();
  console.log("FeeManager deployed to:", feeManagerAddress);

  // Deploy SecurityManager
  console.log("\nDeploying SecurityManager...");
  const SecurityManager = await hre.ethers.getContractFactory("SecurityManager");
  const securityManager = await SecurityManager.deploy();
  await securityManager.waitForDeployment();
  const securityManagerAddress = await securityManager.getAddress();
  console.log("SecurityManager deployed to:", securityManagerAddress);

  // Wait for block confirmations
  console.log("\nWaiting for block confirmations...");
  await predictionMarket.deploymentTransaction().wait(5);
  await feeManager.deploymentTransaction().wait(5);
  await securityManager.deploymentTransaction().wait(5);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      PredictionMarket: predictionMarketAddress,
      FeeManager: feeManagerAddress,
      SecurityManager: securityManagerAddress,
    },
    configuration: {
      creationFee: hre.ethers.formatEther(creationFee),
      platformFeePercentage: platformFeePercentage,
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `${hre.network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment info saved to:", filepath);

  // Update .env file
  console.log("\nUpdating .env file...");
  updateEnvFile(predictionMarketAddress, hre.network.name);

  // Print summary
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("PredictionMarket:", predictionMarketAddress);
  console.log("FeeManager:", feeManagerAddress);
  console.log("SecurityManager:", securityManagerAddress);
  console.log("\n=== Next Steps ===");
  console.log("1. Verify contracts on BaseScan:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${predictionMarketAddress}`);
  console.log(`   npx hardhat verify --network ${hre.network.name} ${feeManagerAddress} "${creationFee}" ${platformFeePercentage}`);
  console.log(`   npx hardhat verify --network ${hre.network.name} ${securityManagerAddress}`);
  console.log("\n2. Update frontend configuration with contract addresses");
  console.log("\n3. Test contract interactions on the network");
}

function updateEnvFile(contractAddress, network) {
  const envPath = path.join(__dirname, "..", ".env");
  let envContent = "";

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }

  const envVar = "NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS";
  const newLine = `${envVar}=${contractAddress}`;

  if (envContent.includes(envVar)) {
    // Update existing variable
    const regex = new RegExp(`${envVar}=.*`, "g");
    envContent = envContent.replace(regex, newLine);
  } else {
    // Add new variable
    envContent += `\n${newLine}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log(`Updated ${envVar} in .env file`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
