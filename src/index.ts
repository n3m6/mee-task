import {toMultichainNexusAccount, mcUSDC, getMEEVersion, MEEVersion, createMeeClient} from "@biconomy/abstractjs";
import * as process from 'node:process';
import {createClients} from "./create-clients";
import {arbitrum, mainnet} from "viem/chains";
import {createWalletClient} from "viem";

const WHALE_ADDRESS = '0x2df1c51e09aecf9cacb7bc98cb1742757f163df7';

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

  const mcNexus = await toMultichainNexusAccount({
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


  const meeClient = await createMeeClient({account: mcNexus});


  //
  // const quote = await meeClient.getQuote({
  //   instructions: [{
  //     calls: [{ to: "0x...", value: 1n, gasLimit: 100000n }],
  //     chainId: base.id
  //   }],
  //   feeToken: {
  //     address: mcUSDC.addressOn(base.id),
  //     chainId: base.id
  //   }
  // })

// Execute the quote and get back a transaction hash
// This sends the transaction to the network
//   const { hash } = await meeClient.executeQuote({ quote })

}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
