import {
  toMultichainNexusAccount,
  getMEEVersion,
  MEEVersion,
  createMeeClient,
} from "@biconomy/abstractjs";
import * as process from 'node:process';
import {createClients} from "./create-clients";
import {mainnet} from "viem/chains";
import {prepareWallet} from "./prepare-wallet";
import {
  AAVE_POOL_ADDRESS_MAINNET,
  erc20Abi,
  LOCAL_MEE_NODE,
  MAINNET_WHALE_ADDRESS,
  USDC_ADDRESS_MAINNET
} from "./consts";
import {http} from "viem";

async function main() {

  const {
    mainnetTransport,
    mainnetTestClient,
    mainnetPublicClient,
  } = createClients();

  const eoaAccount = await prepareWallet(
    mainnetTestClient,
    mainnetTransport,
    mainnetPublicClient,
  );

  const orchestrator = await toMultichainNexusAccount({
    chainConfigurations: [
      {
        chain: mainnet,
        transport: mainnetTransport,
        version: getMEEVersion(MEEVersion.V2_1_0)
      },

    ],
    signer: eoaAccount,
  });

  console.log(`Orchestrator address: ${orchestrator.addressOn(1)}`);
  const nexusAccountAddress = orchestrator.addressOn(mainnet.id) ?? '0xff';

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
      args: [AAVE_POOL_ADDRESS_MAINNET, 5_000_000_000n]
    }
  })


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
//   }, supplyInstruction);

  console.log(`Instructions built:`);
  console.log(approveInstruction);

  const fusionQuote = await meeClient.getFusionQuote({
    instructions: [approveInstruction],
    delegate: false,
    trigger: {
      chainId: mainnet.id,
      tokenAddress: USDC_ADDRESS_MAINNET,
      amount: 5_000_000_000n,
      gasLimit: 500000n,
    },
    feeToken: {
      address: USDC_ADDRESS_MAINNET,
      chainId: mainnet.id,
    }
  });
  console.log(`Fusion quote: `);
  console.log(fusionQuote);

  const signedQuote = await meeClient.signFusionQuote({fusionQuote});
  console.log(`Signed fusion quote: `);
  console.log(signedQuote);

// Execute the quote and get back a transaction hash
// This sends the transaction to the network
  const {hash} = await meeClient.executeSignedQuote({signedQuote})
  console.log(`Transaction hash: ${hash}`);

  await meeClient.waitForSupertransactionReceipt({hash});
  console.log(`Transaction confirmed!`);

}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
