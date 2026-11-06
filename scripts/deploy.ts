import hre from "hardhat";
const { ethers } = hre;
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("----------------------------------------------------");
  console.log("Deploying RecipeDeck Smart Contract to Botchain...");
  console.log("----------------------------------------------------");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH / BOHR`);

  const RecipeDeck = await ethers.getContractFactory("RecipeDeck");
  const recipeDeck = await RecipeDeck.deploy();

  await recipeDeck.waitForDeployment();
  const contractAddress = await recipeDeck.getAddress();

  console.log("====================================================");
  console.log(`🎉 RecipeDeck successfully deployed to: ${contractAddress}`);
  console.log("====================================================");

  // Save deployed address and ABI information for frontend usage
  const deploymentDir = path.join(process.cwd(), "contracts-data");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentData = {
    address: contractAddress,
    network: "botchain",
    chainId: 968,
    deployer: deployer.address,
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
