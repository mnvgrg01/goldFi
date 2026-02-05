# GoldFi Testing Guide - Full Flow

This guide explains how to test the complete DeFi flow (Deposit → Swap → Borrow → Manage) using both **Local Anvil Fork** and **Arbitrum Sepolia Testnet**.

---

## Environment Configuration

### Do I need `NEXT_PUBLIC_NETWORK`?

**For Local Anvil Testing: NO** - The app auto-detects localhost and enables local mode.

**For Sepolia Testing: YES** - Add `NEXT_PUBLIC_NETWORK=arbitrumSepolia` to your `.env.local`.

### Environment Variables

```bash
# .env.local for LOCAL ANVIL TESTING (recommended for development)
NEXT_PUBLIC_ARB_RPC_URL=http://localhost:8545
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
# NEXT_PUBLIC_NETWORK not needed - defaults to arbitrum, auto-detects localhost

# .env.local for ARBITRUM SEPOLIA TESTING
NEXT_PUBLIC_ARB_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_NETWORK=arbitrumSepolia
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY=your_key  # Required for Sepolia
NEXT_PUBLIC_BICONOMY_BUNDLER_KEY=your_key        # Required for Sepolia
```

---

## Local Anvil vs Sepolia: What's the Difference?

| Component | Local Anvil Fork | Arbitrum Sepolia |
|-----------|------------------|------------------|
| **RPC** | `http://localhost:8545` | `https://sepolia-rollup.arbitrum.io/rpc` |
| **Chain Data** | Fork of mainnet (real contracts, forked state) | Testnet (may have different/no contracts) |
| **Tokens** | Real mainnet tokens (USDT, XAUT0) via fork | Testnet tokens (need to deploy/find) |
| **Gas Fees** | Free (Anvil default accounts have ETH) | Free via Biconomy paymaster |
| **Transactions** | Direct wallet (bypasses Biconomy) | Smart wallet via Biconomy |
| **Morpho Blue** | ✅ Works (forked from mainnet) | ⚠️ May not exist on Sepolia |
| **Uniswap V3** | ✅ Works (forked from mainnet) | ⚠️ Limited pools on Sepolia |

> **Recommendation:** Use **Local Anvil Fork** for development/testing. It provides the full mainnet experience without real funds.

---

## Option A: Testing on Local Anvil Fork (Recommended)

### Prerequisites
1. Foundry installed (`foundryup`)
2. Anvil running
3. Node.js and npm

### Step 1: Start Anvil Fork

```bash
# Terminal 1: Start Anvil forking Arbitrum mainnet
anvil --fork-url https://arb1.arbitrum.io/rpc --chain-id 42161 --port 8545
```

### Step 2: Configure Environment

```bash
# .env.local
NEXT_PUBLIC_ARB_RPC_URL=http://localhost:8545
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

### Step 3: Start the App

```bash
# Terminal 2: Start Next.js dev server
npm run dev
```

### Step 4: Login to the App

1. Open http://localhost:3000
2. Click "Get Started"
3. Login with email (Privy creates embedded wallet)
4. Note your **Smart Wallet Address** from the dashboard

### Step 5: Fund Your Wallet with USDT

Use Anvil to impersonate a USDT whale and transfer tokens:

```bash
# Terminal 3: Fund your wallet

# USDT whale on Arbitrum
WHALE="0xF977814e90dA44bFA03b6295A0616a897441aceC"
YOUR_WALLET="0x..."  # Your smart wallet address from dashboard

# Impersonate the whale
cast rpc anvil_impersonateAccount $WHALE --rpc-url http://localhost:8545

# Transfer 10,000 USDT (6 decimals) - NOTE: --unlocked is required!
cast send 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9 \
  --from $WHALE \
  --unlocked \
  --rpc-url http://localhost:8545 \
  "transfer(address,uint256)" \
  $YOUR_WALLET 10000000000

# Stop impersonation
cast rpc anvil_stopImpersonatingAccount $WHALE --rpc-url http://localhost:8545
```

### Step 6: Fund Your Wallet with ETH (for gas in local mode)

```bash
# Send 1 ETH from Anvil default account
cast send $YOUR_WALLET \
  --value 1ether \
  --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://localhost:8545
```

### Step 7: Test the Full Flow in UI

#### 7.1 Verify Balances
- Refresh the app
- Check your USDT balance shows ~10,000 USDT

#### 7.2 Swap USDT → XAUT0
1. Go to **Swap USDT → XAUT0** section
2. Enter amount (e.g., 5000 USDT)
3. See the quote (in Local Mode, uses fallback pricing)
4. Click "Swap USDT → XAUT0"
5. Approve the transaction in wallet popup
6. Wait for confirmation
7. Verify XAUT0 balance increased

#### 7.3 Supply Collateral
1. Go to **Collateral & Borrow** section
2. Select "Supply Collateral" tab
3. Enter XAUT0 amount to supply
4. Click "Supply Collateral"
5. Approve transaction
6. Verify collateral shown in position

#### 7.4 Borrow USDT
1. Switch to "Borrow USDT" tab
2. Enter borrow amount (watch LTV indicator)
3. Click "Borrow USDT"
4. Approve transaction
5. Verify USDT balance increased and debt shown

#### 7.5 Manage Position
1. Go to **Manage Position** section
2. Try "Repay" - repay some debt
3. Try "Add Coll." - add more collateral
4. Try "Withdraw" - withdraw excess collateral

### Step 8: Verify via Cast Commands

```bash
# Check USDT balance
cast call 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9 \
  "balanceOf(address)(uint256)" $YOUR_WALLET \
  --rpc-url http://localhost:8545

# Check XAUT0 balance
cast call 0x40461291347e1eCbb09499F3371D3f17f10d7159 \
  "balanceOf(address)(uint256)" $YOUR_WALLET \
  --rpc-url http://localhost:8545

# Check Morpho position
cast call 0x6c247b1F6182318877311737BaC0844bAa518F5e \
  "position(bytes32,address)((uint256,uint128,uint128))" \
  0x1d094624063756fc61aaf061c7da056aebe3b3ad0ae0395b22e00db6c074de7c \
  $YOUR_WALLET \
  --rpc-url http://localhost:8545
```

---

## Option B: Testing on Arbitrum Sepolia

> ⚠️ **Note:** Arbitrum Sepolia may not have Morpho Blue or the required Uniswap pools deployed. This option is best for testing Privy + Biconomy integration only.

### Step 1: Configure Environment

```bash
# .env.local
NEXT_PUBLIC_ARB_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_NETWORK=arbitrumSepolia
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY=your_biconomy_key
NEXT_PUBLIC_BICONOMY_BUNDLER_KEY=your_bundler_key
```

### Step 2: Get Sepolia ETH

1. Go to [Arbitrum Sepolia Faucet](https://www.alchemy.com/faucets/arbitrum-sepolia)
2. Request testnet ETH
3. Bridge to Arbitrum Sepolia if needed

### Step 3: Get Test Tokens

- Find or deploy test USDT and XAUT0 contracts on Sepolia
- Or modify `constants.ts` with Sepolia token addresses

### Step 4: Start App and Test

```bash
npm run dev
```

The app will use Biconomy smart wallet for gasless transactions.

---

## Troubleshooting

### "Local Mode" indicator not showing
- Verify `NEXT_PUBLIC_ARB_RPC_URL=http://localhost:8545`
- Restart the dev server after changing `.env.local`

### Transaction fails with "insufficient funds"
- Make sure you funded your wallet with ETH (Step 6)
- In local mode, you pay gas directly

### Swap quote shows 0
- Uniswap quoter may not work on fork
- App automatically falls back to mock pricing in Local Mode

### Morpho position not updating
- Refresh the page after transactions
- Check cast commands to verify on-chain state

---

## Quick Reference: Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                      LOCAL ANVIL FORK                           │
│                                                                 │
│  ┌─────────┐    ┌──────────┐    ┌─────────┐    ┌────────────┐  │
│  │ Deposit │ →  │   Swap   │ →  │ Supply  │ →  │   Borrow   │  │
│  │  USDT   │    │USDT→XAUT0│    │Collateral│   │    USDT    │  │
│  └─────────┘    └──────────┘    └─────────┘    └────────────┘  │
│       ↑              ↑              ↑               ↑          │
│   via Anvil     Uniswap V3      Morpho Blue    Morpho Blue     │
│  impersonate    (on fork)       (on fork)       (on fork)      │
│                                                                 │
│  • Direct wallet transactions (no Biconomy)                     │
│  • Real mainnet contracts via fork                              │
│  • Free gas from Anvil accounts                                 │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARBITRUM SEPOLIA                             │
│                                                                 │
│  ┌─────────┐    ┌──────────┐    ┌─────────┐    ┌────────────┐  │
│  │ Deposit │ →  │   Swap   │ →  │ Supply  │ →  │   Borrow   │  │
│  │  USDT   │    │USDT→XAUT0│    │Collateral│   │    USDT    │  │
│  └─────────┘    └──────────┘    └─────────┘    └────────────┘  │
│       ↑              ↑              ↑               ↑          │
│    Faucet       Uniswap V3      Morpho Blue    Morpho Blue     │
│  or bridge     (if exists)     (if exists)     (if exists)     │
│                                                                 │
│  • Biconomy smart wallet (gasless)                              │
│  • Testnet contracts (may not exist)                           │
│  • Real testnet transactions                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Bottom line:** Use Local Anvil Fork for reliable full-flow testing!
