import { arbitrum, arbitrumSepolia } from "viem/chains";

// Network type
export type NetworkName = "arbitrum" | "arbitrumSepolia";

// Get current network from env
export const CURRENT_NETWORK: NetworkName =
  (process.env.NEXT_PUBLIC_NETWORK as NetworkName) || "arbitrum";

// Network configurations
export const NETWORK_CONFIG = {
  arbitrum: {
    chain: arbitrum,
    chainId: 42161,
    name: "Arbitrum One",
    rpcUrl: process.env.NEXT_PUBLIC_ARB_RPC_URL || "https://arb1.arbitrum.io/rpc",
    explorer: "https://arbiscan.io",
    tokens: {
      USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as const,
      XAUT0: "0x40461291347e1eCbb09499F3371D3f17f10d7159" as const,
    },
    uniswap: {
      ROUTER: "0xE592427A0AEce92De3Edee1F18E0157C05861564" as const, // V3 SwapRouter
      QUOTER: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6" as const, // V3 Quoter
      POOL_FEE: 10000, // 1% fee tier - XAUT0/USDT pool with liquidity
    },
    morpho: {
      BLUE: "0x6c247b1F6182318877311737BaC0844bAa518F5e" as const,
      MARKET_ID: "0x1d094624063756fc61aaf061c7da056aebe3b3ad0ae0395b22e00db6c074de7c" as const,
      MARKET: {
        loanToken: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as const,
        collateralToken: "0x40461291347e1eCbb09499F3371D3f17f10d7159" as const,
        oracle: "0xADE5f08073E1097242F8E73c51213438D214896E" as const,
        irm: "0x66F30587FB8D4206918deb78ecA7d5eBbafD06DA" as const,
        lltv: BigInt("770000000000000000"), // 77% LLTV
      },
    },
  },
  arbitrumSepolia: {
    chain: arbitrumSepolia,
    chainId: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl: process.env.NEXT_PUBLIC_ARB_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
    explorer: "https://sepolia.arbiscan.io",
    tokens: {
      // Testnet token addresses (placeholders - update with actual testnet tokens)
      USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as const,
      XAUT0: "0x40461291347e1eCbb09499F3371D3f17f10d7159" as const,
    },
    uniswap: {
      ROUTER: "0xE592427A0AEce92De3Edee1F18E0157C05861564" as const,
      QUOTER: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6" as const,
      POOL_FEE: 10000, // 1% fee tier
    },
    morpho: {
      BLUE: "0x6c247b1F6182318877311737BaC0844bAa518F5e" as const,
      MARKET_ID: "0x1d094624063756fc61aaf061c7da056aebe3b3ad0ae0395b22e00db6c074de7c" as const,
      MARKET: {
        loanToken: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as const,
        collateralToken: "0x40461291347e1eCbb09499F3371D3f17f10d7159" as const,
        oracle: "0xADE5f08073E1097242F8E73c51213438D214896E" as const,
        irm: "0x66F30587FB8D4206918deb78ecA7d5eBbafD06DA" as const,
        lltv: BigInt("770000000000000000"), // 77% LLTV
      },
    },
  },
} as const;

// Helper to get current network config
export function getNetworkConfig() {
  return NETWORK_CONFIG[CURRENT_NETWORK];
}

// Export current network values for backward compatibility
const config = getNetworkConfig();

export const CHAIN = config.chain;
export const CHAIN_ID = config.chainId;

export const TOKENS = config.tokens;

export const MORPHO = {
  BLUE: config.morpho.BLUE,
  MARKET_ID: config.morpho.MARKET_ID,
  MARKET: config.morpho.MARKET,
} as const;

export const UNISWAP = config.uniswap;

// Token decimals
export const DECIMALS = {
  USDT: 6,
  XAUT0: 6,
} as const;

// UI Constants
export const MAX_LTV = 0.60; // 60% max LTV for safe borrowing (conservative)
export const LIQUIDATION_THRESHOLD = 0.77; // 77% LLTV

// Helper functions
export function getExplorerUrl(txHash: string): string {
  return `${config.explorer}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `${config.explorer}/address/${address}`;
}

export function isLocalNetwork(): boolean {
  const rpcUrl = config.rpcUrl.toLowerCase();
  return rpcUrl.includes("localhost") || rpcUrl.includes("127.0.0.1");
}
