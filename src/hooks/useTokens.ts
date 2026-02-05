"use client";

import { useReadContract, useBalance } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { ERC20_ABI } from "@/lib/abis";
import { TOKENS, DECIMALS } from "@/lib/constants";

export function useTokenBalance(tokenAddress: string, userAddress?: string) {
  const { data: balance, isLoading, refetch } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Determine correct decimals based on token address
  const decimals = tokenAddress.toLowerCase() === TOKENS.XAUT0.toLowerCase()
    ? DECIMALS.XAUT0
    : DECIMALS.USDT;

  const formattedBalance = balance ? formatUnits(balance, decimals) : "0";

  return {
    balance,
    formattedBalance,
    isLoading,
    refetch,
  };
}

export function useTokenAllowance(
  tokenAddress: string,
  owner?: string,
  spender?: string
) {
  const { data: allowance, isLoading, refetch } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: owner && spender ? [owner as `0x${string}`, spender as `0x${string}`] : undefined,
    query: {
      enabled: !!owner && !!spender,
    },
  });

  return {
    allowance: allowance || BigInt(0),
    isLoading,
    refetch,
  };
}

export function useTokenDecimals(tokenAddress: string) {
  const { data: decimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  return decimals || 18;
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
