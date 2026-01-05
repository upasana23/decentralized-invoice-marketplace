import { JsonRpcProvider } from 'ethers';

// Polygon Mainnet URL
const POLYGON_MAINNET_URL = 'https://polygon-rpc.com/';

// Create a new instance of JsonRpcProvider
const web3 = new JsonRpcProvider(POLYGON_MAINNET_URL);

export default web3;
