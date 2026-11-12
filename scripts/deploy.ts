import hre from "hardhat";
const { ethers } = hre;
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("----------------------------------------------------");
  console.log(`Deploying RecipeDeck Smart Contract to ${hre.network.name}...`);
  console.log("----------------------------------------------------");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} BOT`);

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei");
  console.log(`Current gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);

  const RecipeDeck = await ethers.getContractFactory("RecipeDeck");

  // Get deployment transaction data and estimate gas accurately
  const deployTx = await RecipeDeck.getDeployTransaction();
  const estimatedGas = await ethers.provider.estimateGas(deployTx);
  console.log(`Estimated deployment gas limit: ${estimatedGas.toString()}`);
  
  const estimatedCost = estimatedGas * gasPrice;
  console.log(`Estimated deployment cost: ${ethers.formatEther(estimatedCost)} BOT`);

  if (balance < estimatedCost) {
    throw new Error(`Insufficient funds: Balance is ${ethers.formatEther(balance)} BOT, needed ~${ethers.formatEther(estimatedCost)} BOT`);
  }

  // Deploy with estimated gas and safe modest 15% buffer to guarantee inclusion without wasting gas
  const gasLimit = (estimatedGas * 115n) / 100n;
  console.log(`Deploying with optimized gasLimit: ${gasLimit.toString()} at ${ethers.formatUnits(gasPrice, "gwei")} gwei...`);

  const recipeDeck = await RecipeDeck.deploy({
    gasLimit,
    gasPrice,
  });

  const deployHash = recipeDeck.deploymentTransaction()?.hash;
  console.log(`Transaction submitted with hash: ${deployHash}`);
  console.log("Waiting for block confirmation on Botchain Mainnet...");

  await recipeDeck.waitForDeployment();
  const contractAddress = await recipeDeck.getAddress();

  console.log("====================================================");
  console.log(`🎉 RecipeDeck successfully deployed to: ${contractAddress}`);
  console.log(`Explorer: https://scan.botchain.ai/address/${contractAddress}`);
  console.log("====================================================");

  // Save deployed address and ABI information for frontend usage
  const deploymentDir = path.join(process.cwd(), "contracts-data");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentData = {
    address: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    txHash: deployHash,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(deploymentDir, "RecipeDeck-address.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  console.log(`Saved deployment info to contracts-data/RecipeDeck-address.json`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
