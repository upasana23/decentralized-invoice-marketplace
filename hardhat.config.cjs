require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const {
  POLYGON_MAINNET_RPC_URL,
  POLYGON_MAINNET_PRIVATE_KEY,
  POLYGON_AMOY_RPC_URL,
  POLYGON_AMOY_PRIVATE_KEY,
} = process.env;

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: "0.8.20",
  networks: {
    polygon: {
      url: POLYGON_MAINNET_RPC_URL || "",
      accounts: POLYGON_MAINNET_PRIVATE_KEY ? [POLYGON_MAINNET_PRIVATE_KEY] : [],
    },
    polygonAmoy: {
      url: POLYGON_AMOY_RPC_URL || "",
      accounts: POLYGON_AMOY_PRIVATE_KEY ? [POLYGON_AMOY_PRIVATE_KEY] : [],
      chainId: 80002, // Adding this ensures you are on the correct Amoy network
    },
  },
};