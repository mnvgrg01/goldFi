"use client";

import { useReadContract, useBalance } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { ERC20_ABI, MORPHO_BLUE_ABI } from "@/lib/abis";
import { MORPHO, TOKENS, DECIMALS, MAX_LTV } from "@/lib/constants";

// ============================================================================
// Token Hooks (consolidated from useTokens.ts)
// ============================================================================

export function useTokenBalance(tokenAddress: string, userAddress?: string) {
  const { data: balance, isLoading, refetch } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { enabled: !!userAddress },
  });

  const decimals = tokenAddress === TOKENS.USDT ? DECIMALS.USDT : DECIMALS.XAUT0;
  const formattedBalance = balance ? formatUnits(balance, decimals) : "0";

  return { balance, formattedBalance, isLoading, refetch };
}

export function useTokenAllowance(tokenAddress: string, owner?: string, spender?: string) {
  const { data: allowance, isLoading, refetch } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: owner && spender ? [owner as `0x${string}`, spender as `0x${string}`] : undefined,
    query: { enabled: !!owner && !!spender },
  });

  return { allowance: allowance || BigInt(0), isLoading, refetch };
}

export function useNativeBalance(address?: string) {
  const { data: balance, isLoading } = useBalance({
    address: address as `0x${string}` | undefined,
  });

  return {
    balance: balance?.value || BigInt(0),
    formattedBalance: balance ? formatUnits(balance.value, 18) : "0",
    isLoading,
  };
}

// ============================================================================
// Morpho Hooks (consolidated from useMorpho.ts)
// ============================================================================

export interface Position {
  supplyShares: bigint;
  borrowShares: bigint;
  collateral: bigint;
}

export interface Market {
  totalSupplyAssets: bigint;
  totalSupplyShares: bigint;
  totalBorrowAssets: bigint;
  totalBorrowShares: bigint;
  lastUpdate: bigint;
  fee: bigint;
}

export function useMorphoPosition(userAddress?: string) {
  const { data: position, isLoading, refetch } = useReadContract({
    address: MORPHO.BLUE as `0x${string}`,
    abi: MORPHO_BLUE_ABI,
    functionName: "position",
    args: userAddress 
      ? [MORPHO.MARKET_ID as `0x${string}`, userAddress as `0x${string}`]
      : undefined,
    query: { enabled: !!userAddress },
  });

  const typedPosition = position as Position | undefined;

  return {
    position: typedPosition,
    formattedCollateral: typedPosition?.collateral 
      ? formatUnits(typedPosition.collateral, DECIMALS.XAUT0)
      : "0",
    formattedBorrowShares: typedPosition?.borrowShares 
      ? formatUnits(typedPosition.borrowShares, 18)
      : "0",
    isLoading,
    refetch,
  };
}

export function useMorphoMarket() {
  const { data: market, isLoading, refetch } = useReadContract({
    address: MORPHO.BLUE as `0x${string}`,
    abi: MORPHO_BLUE_ABI,
    functionName: "market",
    args: [MORPHO.MARKET_ID as `0x${string}`],
  });

  const typedMarket = market as Market | undefined;
  const availableLiquidity = typedMarket 
    ? typedMarket.totalSupplyAssets - typedMarket.totalBorrowAssets
    : BigInt(0);

  // Estimate APR (simplified - in production would use IRM contract)
  const estimatedApr = typedMarket && typedMarket.totalSupplyAssets > 0
    ? (Number(typedMarket.totalBorrowAssets) / Number(typedMarket.totalSupplyAssets)) * 0.05
    : 0.03;

  return {
    market: typedMarket,
    availableLiquidity,
    formattedLiquidity: formatUnits(availableLiquidity, DECIMALS.USDT),
    formattedTotalBorrowed: typedMarket 
      ? formatUnits(typedMarket.totalBorrowAssets, DECIMALS.USDT)
      : "0",
    estimatedApr,
    isLoading,
    refetch,
  };
}

// ============================================================================
// Position Calculation Utilities
// ============================================================================

export interface PositionMetrics {
  collateralValue: number;
  maxBorrow: number;
  currentBorrowed: number;
  availableToBorrow: number;
  ltv: number;
  healthFactor: number;
}

export function calculatePositionMetrics(
  collateralAmount: string,
  borrowAmount: string,
  collateralPrice: number
): PositionMetrics {
  const collateralValue = parseFloat(collateralAmount || "0") * collateralPrice;
  const borrowedValue = parseFloat(borrowAmount || "0");
  const maxBorrow = collateralValue * MAX_LTV;
  
  return {
    collateralValue,
    maxBorrow,
    currentBorrowed: borrowedValue,
    availableToBorrow: Math.max(0, maxBorrow - borrowedValue),
    ltv: collateralValue > 0 ? (borrowedValue / collateralValue) * 100 : 0,
    healthFactor: borrowedValue > 0 ? collateralValue / borrowedValue : Infinity,
  };
}

export function calculateMaxBorrow(collateralAmount: string, collateralPrice: number): string {
  const collateralValue = parseFloat(collateralAmount || "0") * collateralPrice;
  return (collateralValue * MAX_LTV).toFixed(2);
}

export function calculateLtv(collateralAmount: string, borrowAmount: string, collateralPrice: number): number {
  const collateralValue = parseFloat(collateralAmount || "0") * collateralPrice;
  const borrowValue = parseFloat(borrowAmount || "0");
  return collateralValue > 0 ? (borrowValue / collateralValue) * 100 : 0;
}

export function calculateHealthFactor(
  collateralAmount: string,
  borrowAmount: string,
  collateralPrice: number
): number {
  const collateralValue = parseFloat(collateralAmount || "0") * collateralPrice;
  const borrowValue = parseFloat(borrowAmount || "0");
  return borrowValue > 0 ? collateralValue / borrowValue : Infinity;
}
