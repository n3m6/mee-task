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

const WHALE_ADDRESS = '0x2df1c51e09aecf9cacb7bc98cb1742757f163df7';
const LOCAL_MEE_NODE = 'http://localhost:3000/v3';
const USDC_ADDRESS_ARBITRUM = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

const erc20Abi = parseAbi(['function transfer(address to, uint256 value) public returns (bool)']);


async function main() {

  const {
    mainnetTransport,
    arbitrumTransport,
    arbTestClient,
    mainnetTestClient,
    mainnetPublicClient,
    arbPublicClient
  } = createClients();

  await arbTestClient.impersonateAccount({
    address: WHALE_ADDRESS
  });

  const balance = await mainnetPublicClient.getBalance({address: WHALE_ADDRESS});
  console.log(`Impersonated account balance on mainnet: ${balance}`);

  const eoaAccount = createWalletClient({
    account: WHALE_ADDRESS,
    chain: arbitrum,
    transport: arbitrumTransport
  });

  console.log(`EOA account address: ${eoaAccount.account.address}`);

  const nexusAccount = await toNexusAccount({
    signer: eoaAccount,
    chainConfiguration: {
      chain: arbitrum,
      transport: arbitrumTransport,
      version: getMEEVersion(MEEVersion.V2_1_0)
    }
  })

  // const bicoBundler = createBicoBundlerClient({
  //   bundlerUrl: LOCAL_MEE_NODE,
  //   account: nexusAccount
  // })

  const nexusAccountAddress = await nexusAccount.getAddress()
  console.log(`Nexus account address: ${nexusAccountAddress}`);


  const orchestrator = await toMultichainNexusAccount({
    chainConfigurations: [
      {
        chain: mainnet,
        transport: mainnetTransport,
        version: getMEEVersion(MEEVersion.V2_1_0)
      },
      {
        chain: arbitrum,
        transport: arbitrumTransport,
        version: getMEEVersion(MEEVersion.V2_1_0)
      }
    ],
    signer: eoaAccount
  });


  const meeClient = await createMeeClient({
    account: orchestrator,
    url: LOCAL_MEE_NODE,
  });


  const instructions = await orchestrator.buildComposable({
    type: 'default',
    data: {
      abi: erc20Abi,
      chainId: arbitrum.id,
      to: USDC_ADDRESS_ARBITRUM,
      functionName: 'transfer',
      args: [nexusAccountAddress, 5_000_000_000n] // 5000 USDC in 6 decimals
    }
  });

  const fusionQuote = await meeClient.getFusionQuote({
    instructions,
    trigger: {
      chainId: arbitrum.id,
      tokenAddress: USDC_ADDRESS_ARBITRUM,
      amount: 5_000_000_000n
    },
    feeToken: {
      address: USDC_ADDRESS_ARBITRUM,
      chainId: arbitrum.id
    }
  });

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
