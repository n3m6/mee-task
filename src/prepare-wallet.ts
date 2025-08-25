import {createWalletClient, TestClient, http, Transport, PublicClient} from "viem";
import {mainnet} from "viem/chains";
import {privateKeyToAccount} from "viem/accounts";
import {ANVIL_PRIVATE_KEY, erc20Abi, MAINNET_WHALE_ADDRESS, USDC_ADDRESS_MAINNET} from "./consts";

export const prepareWallet = async (
  mainnetTestClient: TestClient,
  mainnetTransport: Transport,
  mainnetPublicClient: PublicClient,
) => {
  const whaleAddress = MAINNET_WHALE_ADDRESS;
  const privateKey = ANVIL_PRIVATE_KEY;

  await mainnetTestClient.impersonateAccount({
    address: whaleAddress
  });

  // Create a wallet client for the impersonated whale account
  const whaleWalletClient = createWalletClient({
    account: whaleAddress,
    chain: mainnet,
    transport: mainnetTransport
  });

  // Create a proper account from private key
  const account = privateKeyToAccount(privateKey);

  const eoaAccount = createWalletClient({
    account,
    chain: mainnet,
    transport: mainnetTransport
  });

  // Transfer USDC from whale to the new account
  await whaleWalletClient.writeContract({
    account: whaleAddress,
    address: USDC_ADDRESS_MAINNET,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [account.address, 15_000_000_000n]
  });

  console.log(`EOA account address: ${eoaAccount.account.address}`);


  const balance = await mainnetPublicClient.getBalance({address: eoaAccount.account.address});
  console.log(`EOA ETH balance on mainnet: ${balance}`);


  const addressBalance = await mainnetPublicClient.readContract({
    address: USDC_ADDRESS_MAINNET,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [eoaAccount.account.address]
  })
  console.log(`EOA USDC balance on mainnet: ${addressBalance}`);

  return eoaAccount;
};