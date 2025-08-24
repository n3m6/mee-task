import {createPublicClient, createTestClient, http, TestClient} from "viem";
import {arbitrum, mainnet} from "viem/chains";

export const createClients = () => {
  const mainnetTransport = http('http://localhost:8545');
  const arbitrumTransport = http('http://localhost:8546');

  const arbTestClient: TestClient = createTestClient({
    chain: arbitrum,
    mode: 'anvil',
    transport: arbitrumTransport,
    name: 'Arbitrum Test Client'
  });

  const mainnetTestClient: TestClient = createTestClient({
    chain: mainnet,
    mode: 'anvil',
    transport: mainnetTransport,
    name: 'Mainnet Test Client'
  });

  const mainnetPublicClient = createPublicClient({
    chain: mainnet,
    transport: mainnetTransport
  });

  const arbPublicClient = createPublicClient({
    chain: arbitrum,
    transport: arbitrumTransport
  });

  return {
    mainnetTransport,
    arbitrumTransport,
    arbTestClient,
    mainnetTestClient,
    mainnetPublicClient,
    arbPublicClient
  };
}