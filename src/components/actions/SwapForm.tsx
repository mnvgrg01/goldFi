"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSmartWallet } from "@/hooks/useSmartWallet";
import { useTokenBalance } from "@/hooks/useTokens";
import { TOKENS, DECIMALS, isLocalNetwork, getExplorerUrl, UNISWAP } from "@/lib/constants";
import {
  getSwapQuote,
  buildSwapBundle,
  calculateSwapOutputFallback,
  type SwapQuote
} from "@/lib/uniswap";
import { ArrowRightLeft, ChevronDown, Info, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { parseUnits } from "viem";
import type { Address } from "viem";

// Fallback prices for local testing when Uniswap quoter isn't available
const USDT_PRICE = 1;
const XAUT0_PRICE = 2650;

export function SwapForm() {
  const { smartAccountAddress, sendTransaction } = useSmartWallet();
  const { formattedBalance: usdtBalance, refetch: refetchUsdt } = useTokenBalance(
    TOKENS.USDT,
    smartAccountAddress || undefined
  );
  const { formattedBalance: xautBalance, refetch: refetchXaut } = useTokenBalance(
    TOKENS.XAUT0,
    smartAccountAddress || undefined
  );

  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuoting, setIsQuoting] = useState(false);
  const [slippage, setSlippage] = useState(5); // 5% default for fork testing
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useLocalMode, setUseLocalMode] = useState(isLocalNetwork());

  // Debounced quote fetching
  const fetchQuote = useCallback(async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      setBuyAmount("");
      setQuote(null);
      return;
    }

    // Use fallback calculation for local testing or if quoter fails
    if (useLocalMode) {
      const output = calculateSwapOutputFallback(
        amount,
        USDT_PRICE,
        XAUT0_PRICE,
        slippage / 100
      );
      setBuyAmount(output);
      setQuote(null);
      return;
    }

    setIsQuoting(true);
    try {
      const result = await getSwapQuote(
        TOKENS.USDT as Address,
        TOKENS.XAUT0 as Address,
        amount,
        DECIMALS.USDT
      );

      if (result) {
        setQuote(result);
        setBuyAmount(result.amountOutFormatted);
      } else {
        // Fallback to local calculation
        const output = calculateSwapOutputFallback(
          amount,
          USDT_PRICE,
          XAUT0_PRICE,
          slippage / 100
        );
        setBuyAmount(output);
        setQuote(null);
      }
    } catch (err) {
      console.error("Quote error:", err);
      // Fallback to local calculation
      const output = calculateSwapOutputFallback(
        amount,
        USDT_PRICE,
        XAUT0_PRICE,
        slippage / 100
      );
      setBuyAmount(output);
      setQuote(null);
    } finally {
      setIsQuoting(false);
    }
  }, [slippage, useLocalMode]);

  // Fetch quote when sell amount changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuote(sellAmount);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [sellAmount, fetchQuote]);

  const handleSwap = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0 || !smartAccountAddress) return;

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const amountIn = parseUnits(sellAmount, DECIMALS.USDT);
      const amountOutMin = quote
        ? quote.amountOut
        : parseUnits(buyAmount, DECIMALS.XAUT0);

      // Build the bundled approval + swap transaction
      const transactions = buildSwapBundle(
        TOKENS.USDT as Address,
        TOKENS.XAUT0 as Address,
        amountIn,
        amountOutMin,
        smartAccountAddress as Address,
        slippage
      );

      // Execute via smart wallet (gasless via Biconomy)
      const hash = await sendTransaction(transactions);
      setTxHash(hash);

      // Reset form and refresh balances
      setSellAmount("");
      setBuyAmount("");
      setQuote(null);

      // Refresh balances after a short delay
      setTimeout(() => {
        refetchUsdt();
        refetchXaut();
      }, 2000);

    } catch (err: any) {
      console.error("Swap error:", err);
      setError(err.message || "Swap failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const setMaxAmount = () => {
    setSellAmount(usdtBalance);
  };

  const toggleLocalMode = () => {
    setUseLocalMode(!useLocalMode);
    // Re-fetch quote with new mode
    if (sellAmount) {
      fetchQuote(sellAmount);
    }
  };

  const insufficientBalance = parseFloat(sellAmount) > parseFloat(usdtBalance);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-500" />
            Swap USDT → XAUT0
          </div>
          {isLocalNetwork() && (
            <button
              onClick={toggleLocalMode}
              className={`text-xs px-2 py-1 rounded ${useLocalMode
                ? "bg-yellow-100 text-yellow-700"
                : "bg-green-100 text-green-700"
                }`}
            >
              {useLocalMode ? "Local Mode" : "Live Quotes"}
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sell Input */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">From</span>
            <span className="text-gray-500">
              Balance: {formatCurrency(usdtBalance, 2)} USDT
            </span>
          </div>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              className="pr-24 text-lg"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={setMaxAmount}
                className="text-xs font-medium text-amber-600 hover:text-amber-700"
              >
                MAX
              </button>
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                <span className="text-sm font-medium">USDT</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            ≈ ${formatCurrency(parseFloat(sellAmount || "0"), 2)}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            {isQuoting ? (
              <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Buy Input */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">To</span>
            <span className="text-gray-500">
              Balance: {formatCurrency(xautBalance, 4)} XAUT0
            </span>
          </div>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={buyAmount}
              readOnly
              className="pr-24 text-lg bg-gray-50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-lg">
                <span className="text-sm font-medium text-amber-900">XAUT0</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            ≈ ${formatCurrency(parseFloat(buyAmount || "0") * XAUT0_PRICE, 2)}
          </p>
        </div>

        {/* Swap Details */}
        <div className="p-4 bg-gray-50 rounded-xl space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Rate</span>
            <span className="text-gray-900">
              1 XAUT0 ≈ ${formatCurrency(XAUT0_PRICE)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Slippage Tolerance</span>
            <select
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value))}
              className="bg-transparent text-gray-900 font-medium text-right"
            >
              <option value={0.1}>0.1%</option>
              <option value={0.5}>0.5%</option>
              <option value={1.0}>1.0%</option>
              <option value={3.0}>3.0%</option>
              <option value={5.0}>5.0%</option>
              <option value={10.0}>10.0%</option>
            </select>
          </div>
          {quote && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pool Fee</span>
              <span className="text-gray-900">{quote.poolFee}%</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Network Fee</span>
            <span className="text-green-600 font-medium">Free (sponsored)</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            Swaps are executed via Uniswap V3 on Arbitrum.
            No gas fees required - transactions are sponsored.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Swap Button */}
        <Button
          onClick={handleSwap}
          isLoading={isLoading}
          disabled={!sellAmount || parseFloat(sellAmount) <= 0 || insufficientBalance || isQuoting}
          className="w-full"
          size="lg"
        >
          {insufficientBalance
            ? "Insufficient Balance"
            : isQuoting
              ? "Getting Quote..."
              : "Swap USDT → XAUT0"}
        </Button>

        {txHash && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-sm text-green-700">
              Swap submitted!{" "}
              <a
                href={getExplorerUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                View on explorer
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
