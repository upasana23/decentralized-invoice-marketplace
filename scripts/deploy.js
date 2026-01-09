const hre = require("hardhat");

async function main() {
  const InvoiceMarketplace = await hre.ethers.getContractFactory("InvoiceMarketplace");
  const invoiceMarketplace = await InvoiceMarketplace.deploy();

  await invoiceMarketplace.waitForDeployment();

  const address = await invoiceMarketplace.getAddress();
  console.log("InvoiceMarketplace deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
