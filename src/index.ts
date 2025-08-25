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

const erc20Abi = parseAbi(['function transfer(address to, uint256 value) public returns (bool)']);


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

  const nexusAccount = await toNexusAccount({
    signer: eoaAccount,
    chainConfiguration: {
      chain: mainnet,
      transport: mainnetTransport,
      version: getMEEVersion(MEEVersion.V2_1_0)
    }
  });

  const nexusAccountAddress = await nexusAccount.getAddress()
  console.log(`Nexus account address: ${nexusAccountAddress}`);

  const orchestrator = await toMultichainNexusAccount({
    chainConfigurations: [
      {
        chain: mainnet,
        transport: mainnetTransport,
        version: getMEEVersion(MEEVersion.V2_1_0)
      },

    ],
    signer: eoaAccount
  });

  console.log(`Orchestrator address: ${orchestrator.addressOn(1)}`);

  const meeClient = await createMeeClient({
    account: orchestrator,
    url: LOCAL_MEE_NODE,
  });
  console.log(`MEE Client created with account: ${meeClient.account.addressOn(1)}`);

  const instructions = await orchestrator.buildComposable({
    type: 'default',
    data: {
      abi: erc20Abi,
      chainId: mainnet.id,
      to: USDC_ADDRESS_MAINNET,
      functionName: 'transfer',
      args: [nexusAccountAddress, 5_000_000_000n] // 5000 USDC in 6 decimals
    }
  });
  console.log(`Instructions built: ${JSON.stringify(instructions)}`);

  const fusionQuote = await meeClient.getFusionQuote({
    instructions,
    trigger: {
      chainId: mainnet.id,
      tokenAddress: USDC_ADDRESS_MAINNET,
      amount: 5_000_000_000n
    },
    feeToken: {
      address: USDC_ADDRESS_MAINNET,
      chainId: mainnet.id
    }
  });
  console.log(`Fusion quote: ${JSON.stringify(fusionQuote)}`);

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
