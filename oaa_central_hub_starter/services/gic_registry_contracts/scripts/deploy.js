const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying GIC Registry Contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Deploy GICRegistry
  console.log("\n📝 Deploying GICRegistry...");
  const GICRegistry = await ethers.getContractFactory("GICRegistry");
  const treasury = deployer.address; // Use deployer as treasury for now
  const registry = await GICRegistry.deploy(treasury);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ GICRegistry deployed to:", registryAddress);

  // Deploy GICResolver
  console.log("\n🔍 Deploying GICResolver...");
  const GICResolver = await ethers.getContractFactory("GICResolver");
  const resolver = await GICResolver.deploy(registryAddress);
  await resolver.waitForDeployment();
  const resolverAddress = await resolver.getAddress();
  console.log("✅ GICResolver deployed to:", resolverAddress);

  // Set initial parameters
  console.log("\n⚙️  Setting initial parameters...");
  const basePrice = ethers.parseEther("0.01"); // 0.01 ETH
  const renewalPeriod = 90 * 24 * 60 * 60; // 90 days in seconds
  await registry.setParams(basePrice, renewalPeriod, treasury);
  console.log("✅ Initial parameters set");

  // Verify contracts (if not on localhost)
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 31337n) { // Not localhost
    console.log("\n🔍 Verifying contracts on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: registryAddress,
        constructorArguments: [treasury],
      });
      console.log("✅ GICRegistry verified");
    } catch (error) {
      console.log("❌ GICRegistry verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: resolverAddress,
        constructorArguments: [registryAddress],
      });
      console.log("✅ GICResolver verified");
    } catch (error) {
      console.log("❌ GICResolver verification failed:", error.message);
    }
  }

  // Output deployment summary
  console.log("\n🎉 Deployment Complete!");
  console.log("=====================================");
  console.log("Network:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("Deployer:", deployer.address);
  console.log("Treasury:", treasury);
  console.log("GICRegistry:", registryAddress);
  console.log("GICResolver:", resolverAddress);
  console.log("=====================================");
  console.log("\n📋 Next Steps:");
  console.log("1. Update your .env file with the contract addresses");
  console.log("2. Start the GIC Gateway Service");
  console.log("3. Test domain registration and resolution");
  console.log("\n🔗 Gateway Service Configuration:");
  console.log(`GIC_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`GIC_RESOLVER_ADDRESS=${resolverAddress}`);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    treasury: treasury,
    contracts: {
      GICRegistry: registryAddress,
      GICResolver: resolverAddress
    },
    timestamp: new Date().toISOString(),
    parameters: {
      basePriceWei: basePrice.toString(),
      renewalSeconds: renewalPeriod.toString()
    }
  };

  const fs = require('fs');
  fs.writeFileSync('./deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });