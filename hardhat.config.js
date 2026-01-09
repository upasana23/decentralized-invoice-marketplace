require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  
  paths: {
    sources: "./contracts", // Ensures Hardhat looks in the root contracts folder
  },

  networks: {
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC_URL || "",
      accounts: process.env.POLYGON_AMOY_PRIVATE_KEY ? [process.env.POLYGON_AMOY_PRIVATE_KEY] : [],
      chainId: 80002,
    },
  },

  etherscan: {
    apiKey: "4AZ485M74J3GFNRM5P9E9SQANM2J3AEYRX",
  },

  // Added Sourcify as a fallback for the 522 Timeout errors
  sourcify: {
    enabled: true
  }
};