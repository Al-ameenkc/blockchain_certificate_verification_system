import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  
  console.log("");
  console.log("==================================================");
  console.log("🚀 Certificate Registry deployed successfully! ");
  console.log("📜 Contract Address:", address);
  console.log("==================================================");
  console.log("");
  console.log("ACTION REQUIRED:");
  console.log("Copy the Contract Address above into .env.local as NEXT_PUBLIC_CONTRACT_ADDRESS (and redeploy the app if needed).");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
