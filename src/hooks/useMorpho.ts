"use client";

import { useReadContract } from "wagmi";
import { MORPHO_BLUE_ABI } from "@/lib/abis";
import { MORPHO, TOKENS, DECIMALS } from "@/lib/constants";
import { formatUnits, parseUnits } from "viem";

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
    query: {
      enabled: !!userAddress,
    },
  });

  // Fetch market data to convert shares to assets
  const { data: market } = useReadContract({
    address: MORPHO.BLUE as `0x${string}`,
    abi: MORPHO_BLUE_ABI,
    functionName: "market",
    args: [MORPHO.MARKET_ID as `0x${string}`],
  });

  const typedPosition = position as Position | undefined;
  const typedMarket = market as Market | undefined;

  const formattedCollateral = typedPosition?.collateral
    ? formatUnits(typedPosition.collateral, DECIMALS.XAUT0)
    : "0";

  // Calculate borrowed assets from shares
  // Assets = Shares * TotalBorrowAssets / TotalBorrowShares
  let borrowAssets = BigInt(0);
  if (typedPosition?.borrowShares && typedMarket?.totalBorrowShares && typedMarket.totalBorrowShares > 0n) {
    // Round up for debt calculation (conservative)
    borrowAssets = (typedPosition.borrowShares * typedMarket.totalBorrowAssets + typedMarket.totalBorrowShares - 1n) / typedMarket.totalBorrowShares;
  }

  const formattedBorrowAssets = formatUnits(borrowAssets, DECIMALS.USDT);

  const formattedBorrowShares = typedPosition?.borrowShares
    ? formatUnits(typedPosition.borrowShares, 18) // Shares usually have 18 decimals or distinct precision
    : "0";

  // If we have market data, use the calculated assets. Fallback to 0 if loading.
  // Note: For display, we prefer the calculated assets.

  return {
    position: typedPosition,
    formattedCollateral,
    // Return the calculated assets as the primary "borrowed" value for UI
    formattedBorrowAssets,
    formattedBorrowShares,
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

  // Calculate available liquidity
  const availableLiquidity = typedMarket
    ? typedMarket.totalSupplyAssets - typedMarket.totalBorrowAssets
    : BigInt(0);

  const formattedLiquidity = formatUnits(availableLiquidity, DECIMALS.USDT);
  const formattedTotalBorrowed = typedMarket
    ? formatUnits(typedMarket.totalBorrowAssets, DECIMALS.USDT)
    : "0";

  // Estimate APR (simplified - in production would use IRM contract)
  const estimatedApr = typedMarket && typedMarket.totalSupplyAssets > 0
    ? (Number(typedMarket.totalBorrowAssets) / Number(typedMarket.totalSupplyAssets)) * 0.05
    : 0.03;

  return {
    market: typedMarket,
    availableLiquidity,
    formattedLiquidity,
    formattedTotalBorrowed,
    estimatedApr,
    isLoading,
    refetch,
  };
}

export function calculateMaxBorrow(collateralAmount: string, collateralPrice: number): string {
  const collateralValue = parseFloat(collateralAmount) * collateralPrice;
  const maxBorrow = collateralValue * 0.67; // 67% LTV
  return maxBorrow.toFixed(2);
}

export function calculateHealthFactor(
  collateralAmount: string,
  borrowAmount: string,
  collateralPrice: number
): number {
  const collateralValue = parseFloat(collateralAmount) * collateralPrice;
  const borrowValue = parseFloat(borrowAmount);

  if (borrowValue === 0) return Infinity;

  return collateralValue / borrowValue;
}

export function calculateLtv(
  collateralAmount: string,
  borrowAmount: string,
  collateralPrice: number
): number {
  const collateralValue = parseFloat(collateralAmount) * collateralPrice;
  const borrowValue = parseFloat(borrowAmount);

  if (collateralValue === 0) return 0;

  return (borrowValue / collateralValue) * 100;
}
