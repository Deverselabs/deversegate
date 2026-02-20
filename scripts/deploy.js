const hre = require("hardhat");

async function main() {
  console.log("Deploying DeverseGate to Sepolia...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Balance:", hre.ethers.utils.formatEther(balance), "ETH");
  
  if (balance.isZero()) {
    console.log("No ETH! Get from: https://sepoliafaucet.com/");
    process.exit(1);
  }
  
  console.log("Deploying contract...");
  const Contract = await hre.ethers.getContractFactory("DeverseGatePayments");
  const contract = await Contract.deploy();
  await contract.deployed();
  
  console.log("SUCCESS!");
  console.log("Contract:", contract.address);
  console.log("Add to .env: CONTRACT_ADDRESS=" + contract.address);
  console.log("Etherscan: https://sepolia.etherscan.io/address/" + contract.address);
}

main().catch(console.error);
