# mee-task
MEE challenge

1. Create a .env file with the following fields
```bash
MAINNET_RPC_NODE=<MAINNET_RPC_NODE>
ARBITRUM_RPC_NODE=<ARBITRUM_RPC_NODE>
KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
PORT=3000
REDIS_HOST=redis
REDIS_PORT=6379
DOCS_URL=https://documenter.getpostman.com/view/33713944/2sAYBd99Ec
```
2. Run the following command to start the server
```bash
docker compose --env-file .env up
```
3. Wait 1 minute for health check to pass and check `http://localhost:3000/v3/info` to see if the server is running
4. Run `pnpm install` to install dependencies
