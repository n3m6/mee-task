# mee-task
MEE challenge

1. install foundry steps : (to get to anvil)
2. Export your rpc node
```
export RPC_NODE=<rpc_node>
```
3. run forked anvil

```
 anvil --fork-url $RPC_NODE
```
4. run docker compose inside /mee-node-deployment
```
docker compose --env-file .env up -d
```
