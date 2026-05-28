const hre = require("hardhat");

async function main() {
  const Contract = await hre.ethers.getContractFactory("QuickPoll");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log("QuickPoll deployed to:", addr);
}

main().catch(e => { console.error(e); process.exit(1); });
