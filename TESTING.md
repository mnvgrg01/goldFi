# Testing on Local Anvil Fork

This guide explains how to test the GoldFi app on a local Arbitrum fork using Foundry Anvil.

## Prerequisites

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Install Anvil (comes with Foundry):
```bash
anvil --version
```

## Fork Arbitrum Mainnet

Start Anvil with a fork of Arbitrum Mainnet:

```bash
anvil --fork-url https://arb1.arbitrum.io/rpc --chain-id 42161 --port 8545
```

Or with Alchemy/Infura for better reliability:
```bash
anvil --fork-url https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY --chain-id 42161 --port 8545
```

## Configure App for Local Testing

1. Update your `.env.local`:
```env
# Use localhost RPC for testing
NEXT_PUBLIC_ARB_RPC_URL=http://localhost:8545
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY=your_biconomy_paymaster_key
NEXT_PUBLIC_BICONOMY_BUNDLER_KEY=your_biconomy_bundler_key
```

2. Update `src/lib/constants.ts` to use mainnet addresses (already configured):
- USDT: `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9`
- XAUT0: `0x40461291347e1eCbb09499F3371D3f17f10d7159`
- Morpho Blue: `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`

## Default Anvil Accounts

Anvil provides 10 pre-funded accounts with 10,000 ETH each:

| Account | Address | Private Key |
|---------|---------|-------------|
| 0 | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 |
| 1 | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d |
| ... | ... | ... |

## Test Token Acquisition

Since this is a fork of mainnet, the token balances are preserved. To get test tokens:

### Option 1: Use Existing Whale Addresses
Impersonate a whale account that holds USDT/XAUT0:

```bash
# In a new terminal, impersonate a whale
cast rpc anvil_impersonateAccount 0x...whale_address...

# Transfer USDT to your test account
cast send 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9 \
  --from 0x...whale_address... \
  --rpc-url http://localhost:8545 \
  "transfer(address,uint256)" \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  1000000000000
```

### Option 2: Mint via Deal (Anvil Cheatcode)
Use the anvil `deal` cheatcode to set token balances directly:

```bash
# Set USDT balance for an account (works with Anvil cheatcodes)
cast rpc anvil_setStorageAt \
  0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9 \
  "0x...slot..." \
  "0x...value..." \
  --rpc-url http://localhost:8545
```

## Testing Without Biconomy (Local Mode)

For local testing without Biconomy paymaster, you can modify the hooks to use regular transactions:

### Modified useSmartWallet for Local Testing

```typescript
// src/hooks/useSmartWallet.local.ts
// Use this version for local anvil testing

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useState, useEffect, useCallback } from "react";
import { createWalletClient, custom, http } from "viem";
import { arbitrum } from "viem/chains";
import { CHAIN_ID } from "@/lib/constants";

export function useSmartWallet() {
  const { authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const [walletClient, setWalletClient] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initWallet = async () => {
      if (!authenticated || !ready || !wallets.length) return;
      
      setIsLoading(true);
      try {
        const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
        if (!embeddedWallet) return;

        await embeddedWallet.switchChain(CHAIN_ID);
        const provider = await embeddedWallet.getEthereumProvider();
        
        const client = createWalletClient({
          account: embeddedWallet.address as `0x${string}`,
          chain: arbitrum,
          transport: custom(provider),
        });

        setWalletClient(client);
        setWalletAddress(embeddedWallet.address);
      } catch (error) {
        console.error("Error initializing wallet:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initWallet();
  }, [authenticated, ready, wallets]);

  const sendTransaction = useCallback(async (tx: any) => {
    if (!walletClient) throw new Error("Wallet not initialized");
    return await walletClient.sendTransaction(tx);
  }, [walletClient]);

  return {
    smartAccount: walletClient,
    smartAccountAddress: walletAddress,
    isLoading,
    sendTransaction,
    isAuthenticated: authenticated && ready,
  };
}
```

## Running Tests

### 1. Start Anvil
```bash
anvil --fork-url https://arb1.arbitrum.io/rpc --chain-id 42161
```

### 2. Start the App
```bash
npm run dev
```

### 3. Test Flow
1. Login with email (Privy will create an embedded wallet)
2. Fund the wallet with test ETH from Anvil faucet:
   - Copy the smart wallet address
   - Use Anvil's default accounts to send ETH (for gas)
3. Get USDT via impersonation or deal cheatcode
4. Test the full flow: Deposit → Swap → Borrow → Manage

### 4. Cast Commands for Testing

```bash
# Check ETH balance
cast balance 0x...smart_wallet_address... --rpc-url http://localhost:8545

# Check USDT balance
cast call 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9 \
  "balanceOf(address)(uint256)" \
  0x...smart_wallet_address... \
  --rpc-url http://localhost:8545

# Check XAUT0 balance  
cast call 0x40461291347e1eCbb09499F3371D3f17f10d7159 \
  "balanceOf(address)(uint256)" \
  0x...smart_wallet_address... \
  --rpc-url http://localhost:8545

# Get Morpho position
cast call 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb \
  "position(bytes32,address)((uint128,uint128,uint128))" \
  0x1d094624063756fc61aaf061c7da056aebe3b3ad0ae0395b22e00db6c074de7c \
  0x...smart_wallet_address... \
  --rpc-url http://localhost:8545
```

## Anvil Flags for Testing

```bash
# Fork at specific block
anvil --fork-url https://arb1.arbitrum.io/rpc --fork-block-number 12345678

# Auto-mine with interval
anvil --fork-url https://arb1.arbitrum.io/rpc --block-time 12

# Keep state between restarts
anvil --fork-url https://arb1.arbitrum.io/rpc --state /path/to/state.json

# Load previous state
anvil --fork-url https://arb1.arbitrum.io/rpc --state /path/to/state.json --load-state

# Allow unlimited contract size (for debugging)
anvil --fork-url https://arb1.arbitrum.io/rpc --disable-block-gas-limit
```

## Troubleshooting

### Issue: "Insufficient funds for gas"
Anvil accounts have ETH but your smart wallet might not. Fund the smart wallet address with ETH from a default Anvil account.

### Issue: "Nonce too high"
Reset the nonce manually or restart Anvil.

### Issue: Biconomy paymaster fails locally
Use the local testing mode (see above) that bypasses Biconomy and sends transactions directly.

### Issue: Token approvals failing
On a fork, token approvals persist. You may need to reset the fork or use a fresh Anvil instance.

## Production Deployment

When deploying to production:
1. Switch back to mainnet RPC URLs
2. Ensure Biconomy paymaster is properly configured
3. Test with small amounts first
4. Monitor gas prices and adjust accordingly
