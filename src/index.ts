import {
  toMultichainNexusAccount,
  getMEEVersion,
  MEEVersion,
  createMeeClient, toNexusAccount,
} from "@biconomy/abstractjs";
import * as process from 'node:process';
import {createClients} from "./create-clients";
import {arbitrum, mainnet} from "viem/chains";
import {createWalletClient, parseAbi} from "viem";

//const ARBITRUM_WHALE_ADDRESS = '0x2df1c51e09aecf9cacb7bc98cb1742757f163df7';
const MAINNET_WHALE_ADDRESS = '0xAFCD96e580138CFa2332C632E66308eACD45C5dA';
const LOCAL_MEE_NODE = 'http://localhost:3000/v3';
//const USDC_ADDRESS_ARBITRUM = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const USDC_ADDRESS_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

// Build instructions for what the Nexus account should do once it receives USDC
const aavePoolAddress = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'; // AAVE V3 Pool on mainnet
const aUsdcAddress = '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c'; // aUSDC token address

const aaveAbi = parseAbi([
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external'
]);


const erc20Abi = parseAbi([
  'function transfer(address to, uint256 value) public returns (bool)',
  'function approve(address spender, uint256 value) public returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
]);

async function main() {

  const {
    mainnetTransport,
    mainnetTestClient,
    mainnetPublicClient,
  } = createClients();

  await mainnetTestClient.impersonateAccount({
    address: MAINNET_WHALE_ADDRESS
  });

  const balance = await mainnetPublicClient.getBalance({address: MAINNET_WHALE_ADDRESS});
  console.log(`Impersonated account balance on mainnet: ${balance}`);

  const eoaAccount = createWalletClient({
    account: MAINNET_WHALE_ADDRESS,
    chain: mainnet,
    transport: mainnetTransport
  });
  console.log(`EOA account address: ${eoaAccount.account.address}`);

  const orchestrator = await toMultichainNexusAccount({
    chainConfigurations: [
      {
        chain: mainnet,
        transport: mainnetTransport,
        version: getMEEVersion(MEEVersion.V2_1_0)
      },

    ],
    signer: eoaAccount,
    accountAddress: eoaAccount.account.address,
  });

  console.log(`Orchestrator address: ${orchestrator.addressOn(1)}`);
  const nexusAccountAddress = orchestrator.addressOn(mainnet.id) ?? '0xff';

  // approve USDC for transfer
  await eoaAccount.writeContract({
    address: USDC_ADDRESS_MAINNET,
    abi: erc20Abi,
    functionName: 'approve',
    args: [nexusAccountAddress, 5_000_000_000n] // Approve the transfer amount
  });

  // Verify the approval
  const allowance = await mainnetPublicClient.readContract({
    address: USDC_ADDRESS_MAINNET,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [MAINNET_WHALE_ADDRESS, nexusAccountAddress]
  });
  console.log(`Allowance: ${allowance}`);
  
  const meeClient = await createMeeClient({
    account: orchestrator,
    url: LOCAL_MEE_NODE,
  });
  console.log(`MEE Client created with account: ${meeClient.account.addressOn(1)}`);

  // Build the first instruction (approve AAVE to spend USDC from Nexus)
  const approveInstruction = await orchestrator.buildComposable({
    type: 'default',
    data: {
      abi: erc20Abi,
      chainId: mainnet.id,
      to: USDC_ADDRESS_MAINNET,
      functionName: 'approve',
      args: [aavePoolAddress, 5_000_000_000n] // Approve AAVE pool to spend USDC
    }
  });


// first instruction (AAVE supply)
//   const supplyInstruction = await orchestrator.buildComposable({
//     type: 'default',
//     data: {
//       abi: aaveAbi,
//       chainId: mainnet.id,
//       to: aavePoolAddress,
//       functionName: 'supply',
//       args: [USDC_ADDRESS_MAINNET, 5_000_000_000n, nexusAccountAddress, 0]
//     }
//   }, approveInstruction);

// second instruction (transfer aUSDC back to EOA)
//   const transferInstruction = await orchestrator.buildComposable({
//     type: 'default',
//     data: {
//       abi: erc20Abi,
//       chainId: mainnet.id,
//       to: aUsdcAddress,
//       functionName: 'transfer',
//       args: [MAINNET_WHALE_ADDRESS, 5_000_000_000n]
//     }
//   }, supplyInstruction); // Pass the first instruction as currentInstructions

  console.log(`Instructions built:`);
  console.log(approveInstruction);

// The trigger configuration tells the fusion system to transfer USDC from EOA to Nexus
  const fusionQuote = await meeClient.getFusionQuote({
    instructions: approveInstruction,
    trigger: {
      chainId: mainnet.id,
      tokenAddress: USDC_ADDRESS_MAINNET,
      amount: 5_000_000_000n, // This triggers the EOA -> Nexus transfer
      gasLimit: 150000n // Increase from 75000n
    },
    feeToken: {
      address: USDC_ADDRESS_MAINNET,
      chainId: mainnet.id
    }
  });
  console.log(`Fusion quote: `);
  console.log(fusionQuote);

// Execute the quote and get back a transaction hash
// This sends the transaction to the network
  const {hash} = await meeClient.executeFusionQuote({fusionQuote})
  console.log(`Transaction hash: ${hash}`);

  await meeClient.waitForSupertransactionReceipt({hash});
  console.log(`Transaction confirmed!`);

}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
