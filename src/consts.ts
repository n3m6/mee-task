import {parseAbi} from "viem";

export const MAINNET_WHALE_ADDRESS = '0xAFCD96e580138CFa2332C632E66308eACD45C5dA';
export const LOCAL_MEE_NODE = 'http://localhost:3000/v3';
//const USDC_ADDRESS_ARBITRUM = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
//const ARBITRUM_WHALE_ADDRESS = '0x2df1c51e09aecf9cacb7bc98cb1742757f163df7';
export const USDC_ADDRESS_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
export const AAVE_POOL_ADDRESS_MAINNET = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';
export const aUSDC_ADDRESS_MAINNET = '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c';
//export const nexus120Singleton = '0x000000004F43C49e93C970E84001853a70923B03';


export const aaveAbi = parseAbi([
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external'
]);

export const erc20Abi = parseAbi([
  'function transfer(address to, uint256 value) public returns (bool)',
  'function approve(address spender, uint256 value) public returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)'
]);

export const ANVIL_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
