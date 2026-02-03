"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSmartWallet } from "@/hooks/useSmartWallet";
import { useTokenBalance } from "@/hooks/useTokens";
import { TOKENS, DECIMALS } from "@/lib/constants";
import { getCowSwapQuote, calculateSwapOutput } from "@/lib/cowswap";
import { ArrowRightLeft, ChevronDown, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { parseUnits, formatUnits } from "viem";

// Mock prices - in production would fetch from price oracle
const USDT_PRICE = 1;
const XAUT0_PRICE = 2650;

export function SwapForm() {
  const { smartAccountAddress } = useSmartWallet();
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
  const [isLoading, setIsLoading] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Calculate swap output when input changes
  useEffect(() => {
    if (sellAmount && parseFloat(sellAmount) > 0) {
      const output = calculateSwapOutput(
        sellAmount,
        USDT_PRICE,
        XAUT0_PRICE,
        slippage / 100
      );
      setBuyAmount(output);
    } else {
      setBuyAmount("");
    }
  }, [sellAmount, slippage]);

  const handleSwap = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would:
      // 1. Get quote from CoW Swap API
      // 2. Sign the order with smart wallet
      // 3. Submit order to CoW Swap
      // 4. Wait for execution
      
      // For demo purposes, we'll simulate a swap
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setTxHash("0x" + Math.random().toString(16).slice(2, 42));
      
      // Refresh balances
      refetchUsdt();
      refetchXaut();
    } catch (error) {
      console.error("Swap error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setMaxAmount = () => {
    setSellAmount(usdtBalance);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-amber-500" />
          Swap USDT → XAUT0
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
            <ChevronDown className="w-5 h-5 text-gray-400" />
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
            </select>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Network Fee</span>
            <span className="text-green-600 font-medium">Free (sponsored)</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            Swaps are executed via CoW Swap for the best prices and MEV protection. 
            No gas fees required.
          </p>
        </div>

        {/* Swap Button */}
        <Button
          onClick={handleSwap}
          isLoading={isLoading}
          disabled={!sellAmount || parseFloat(sellAmount) <= 0 || parseFloat(sellAmount) > parseFloat(usdtBalance)}
          className="w-full"
          size="lg"
        >
          {parseFloat(sellAmount) > parseFloat(usdtBalance)
            ? "Insufficient Balance"
            : "Swap USDT → XAUT0"}
        </Button>

        {txHash && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-sm text-green-700">
              Swap submitted!{" "}
              <a
                href={`https://arbiscan.io/tx/${txHash}`}
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
