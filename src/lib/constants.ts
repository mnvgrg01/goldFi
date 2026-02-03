import { arbitrum } from "viem/chains";

// Chain configuration
export const CHAIN = arbitrum;
export const CHAIN_ID = arbitrum.id;

// Token addresses on Arbitrum
export const TOKENS = {
  USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
  XAUT0: "0x40461291347e1eCbb09499F3371D3f17f10d7159",
} as const;

// Morpho market configuration
export const MORPHO = {
  // Morpho Blue contract on Arbitrum
  BLUE: "0x6c247b1F6182318877311737BaC0844bAa518F5e",
  // XAUT0/USDT0 market ID from Morpho app
  MARKET_ID: "0x1d094624063756fc61aaf061c7da056aebe3b3ad0ae0395b22e00db6c074de7c",
  // Market parameters
  MARKET: {
    loanToken: TOKENS.USDT,
    collateralToken: TOKENS.XAUT0,
    oracle: "0xE4d5172EE682B48d73E703Ac0B93bC1F7E85E1B3",
    irm: "0x46415998764C29aB2a25CbeA6254146D50D22687",
    lltv: BigInt("860000000000000000"), // 86% LLTV
  },
} as const;

// CoW Swap API configuration
export const COW_SWAP = {
  API_URL: "https://api.cow.fi/arbitrum/api/v1",
  QUOTE_URL: "https://api.cow.fi/arbitrum/api/v1/quote",
  ORDER_URL: "https://api.cow.fi/arbitrum/api/v1/orders",
} as const;

// Biconomy configuration
export const BICONOMY = {
  PAYMASTER_API_URL: "https://paymaster.biconomy.io/api/v1",
  BUNDLER_URL: "https://bundler.biconomy.io/api/v2",
} as const;

// Token decimals
export const DECIMALS = {
  USDT: 6,
  XAUT0: 6,
} as const;

// UI Constants
export const MAX_LTV = 0.67; // 67% max LTV for safe borrowing
export const LIQUIDATION_THRESHOLD = 0.86; // 86% LLTV
