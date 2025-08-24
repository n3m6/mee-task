# Mee Node Deployment Guide

This repository contains the necessary configuration files to deploy and run a Mee Node. This guide will walk you through the setup process and provide information about node maintenance.

## Prerequisites

- Docker and Docker Compose installed
- Access to RPC endpoints for the chains you want to support
- Sufficient funds in native tokens for the supported chains

## Setting Up a Node

### 1. Clone the Repository

```bash
git clone https://github.com/bcnmy/mee-node-deployment
cd mee-node-deployment
```

### 2. Configure Chain RPC URLs

1. Navigate to the appropriate chains folder:
   - `chains-prod/` for mainnet networks
   - `chains-testnet/` for testnet networks

2. For each chain you want to support, create a JSON file with the RPC configuration.

> **Note**: For mainnet node operators, it's recommended to support all 9 mainnet networks from the `chains-prod` folder.

### 3. Configure Docker Compose

1. Open `docker-compose.yml` and ensure the volumes section points to your chosen chains folder:
   ```yaml
   volumes:
     - ./chains-testnet:/app/chains  # Change to chains-prod for mainnet
   ```

2. You can support both mainnet and testnet by adding JSON files to the loaded chains folder.

### 4. Set Up Environment Variables

You can provide environment variables in two ways:

1. Create a `.env` file with the following minimum configuration:
   ```env
   KEY=<your-private-key>
   PORT=3000
   REDIS_HOST=redis
   REDIS_PORT=6379
   ```
   
   To use the `.env` file, run Docker Compose with the `--env-file` flag:
   ```bash
   docker compose --env-file .env up -d
   ```
   Or you can add the `env_file` directive to your `docker-compose.yml`:
   ```yaml
   services:
     node:
       env_file:
         - .env
   ```

2. Or provide them directly in the `docker-compose.yml` file as shown in the example:
   ```yaml
   environment:
     - KEY=<your-private-key>
     - PORT=3000
     - REDIS_HOST=redis
     - REDIS_PORT=6379
   ```

> **Note**: If you're using your own Redis instance, update `REDIS_HOST` and `REDIS_PORT` accordingly.

### 5. Fund Your Node

Ensure your node's private key address is funded with sufficient native tokens on all supported chains. Recommended minimum funding:

| Chain | Minimum Native Token |
|-------|---------------------|
| ETH-based chains | 0.05 ETH |
| Gnosis Chain | 100 xDAI |
| BSC | 0.17 BNB |
| Sonic Chain | 50 S |
| Polygon | 500 POL |
| Avax C-Chain | 5 AVAX |

### 6. Start the Node

```bash
docker compose up -d
```

Upon successful startup, you should see logs indicating:
- Node initialization
- Chain health checks
- Simulator status

## Additional Configuration Options

The following environment variables can be added to your `.env` file for additional configuration:

| Variable | Description | Default |
|----------|-------------|---------|
| `FEE_BENEFICIARY` | Address that collects node fees | Node's private key address |
| `FEE_PERCENTAGE` | Percentage added to gas fees | 10 |
| `GATEWAY_URL` | Biconomy Network URL | Required for mainnet |
| `ENV_ENC_PASSWORD` | Password for encrypted key file | - |
| `USEROP_MIN_EXEC_WINDOW_DURATION` | Minimum execution window (seconds) | 180 |
| `USEROP_MAX_EXEC_WINDOW_DURATION` | Maximum execution window (seconds) | 600 |
| `USEROP_MAX_WAIT_BEFORE_EXEC_START` | Maximum future execution time (seconds) | 300 |
| `USEROP_TRACE_CALL_SIMULATION_POLL_INTERVAL` | Simulation check interval (seconds) | 2 |
| `USEROP_SAFE_WINDOW_BEFORE_EXEC_END` | Early execution threshold (seconds) | 30 |
| `MAX_CALLDATA_GAS_LIMIT` | Maximum calldata gas limit | 330000001 |
| `HEALTH_CHECK_INTERVAL` | How often the node performs chain health checks (seconds) | 300 |
| `GLUEX_PARTNER_UNIQUE_ID` | Partner ID for GlueX integration | - |
| `GLUEX_API_KEY` | API key for GlueX integration | - |

## Loading Encrypted Private Key

Instead of providing the raw private key, you can use an encrypted key file:

1. Install the ChainLink env-enc package:
   ```bash
   npm install -g @chainlink/env-enc
   ```

2. Generate encrypted key:
   ```bash
   npx env-enc set-pw
   npx env-enc set
   ```
   When prompted, enter "KEY" as the variable name and your private key as the value.

3. Rename the generated file to `key.enc` and place it in the `./keystore` folder.

4. In your `.env` file, replace the `KEY` variable with:
   ```env
   ENV_ENC_PASSWORD=<your-encryption-password>
   ```

## Any Gas Token Support

If you want to support additional gas tokens beyond what's explicitly allowed by the chain configuration, you can activate GlueX integration. This feature enables users to pay for transaction execution using any supported token, while your node receives the native coin.

GlueX integration works by automatically swapping the user's chosen token into the native coin required for execution. This means:
- Users can spend any supported token
- Your node receives the native coin for gas fees
- The swap happens automatically as part of the transaction

To activate GlueX support, add the following environment variables to your configuration:
```env
GLUEX_PARTNER_UNIQUE_ID=<your-partner-id>
GLUEX_API_KEY=<your-api-key>
```

## Node Maintenance

### Monitoring Node Health

1. Check the node status endpoint:
   ```
   http://localhost:3000/v3/info
   ```

2. Monitor chain health status in the response. A healthy chain status looks like:
   ```json
   {
     "chainId": "11155420",
     "name": "OP Sepolia",
     "healthCheck": {
       "rpcOperational": true,
       "debugTraceCallSupported": true,
       "nativeBalance": "528841195784636675",
       "nonce": 5055,
       "execQueueActiveJobs": 0,
       "execQueuePendingJobs": 0,
       "lastChecked": 1743538429111,
       "status": "healthy"
     }
   }
   ```

### Balance Management

1. Regularly monitor native token balances across all supported chains
2. Swap earned ERC20 tokens for native tokens when needed
3. Maintain sufficient funding for gas fees

### Troubleshooting

If a chain shows unhealthy status:
```json
{
  "chainId": "421614",
  "name": "Arbitrum Sepolia",
  "healthCheck": {
    "status": "not-healthy",
    "reason": "native coin balance too low"
  }
}
```

Take appropriate action based on the reported reason:
- Add more native tokens if balance is low
- Check RPC connectivity if RPC is not operational
- Review execution queue if jobs are stuck

## Support

For additional support or questions, please refer to the project documentation or contact the development team.
