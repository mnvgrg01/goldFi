"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSmartWallet } from "@/hooks/useSmartWallet";
import { useMorphoPosition, useMorphoMarket, calculateMaxBorrow, calculateLtv } from "@/hooks/useMorpho";
import { useTokenBalance } from "@/hooks/useTokens";
import { TOKENS, DECIMALS, MAX_LTV } from "@/lib/constants";
import { Wallet, AlertTriangle, Info } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { parseUnits } from "viem";

// Mock XAUT0 price - in production would fetch from oracle
const XAUT0_PRICE = 2650;

export function BorrowForm() {
  const { smartAccountAddress } = useSmartWallet();
  const { position, formattedCollateral } = useMorphoPosition(smartAccountAddress || undefined);
  const { formattedLiquidity, estimatedApr } = useMorphoMarket();
  const { formattedBalance: xautBalance } = useTokenBalance(
    TOKENS.XAUT0,
    smartAccountAddress || undefined
  );

  const [borrowAmount, setBorrowAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Calculate max borrowable amount
  const collateralValue = parseFloat(formattedCollateral) * XAUT0_PRICE;
  const maxBorrow = collateralValue * MAX_LTV;
  
  // Current borrowed amount (simplified)
  const currentBorrowed = parseFloat(position?.borrowShares?.toString() || "0");
  const availableToBorrow = Math.max(0, maxBorrow - currentBorrowed);

  // Calculate new LTV if borrowing
  const newLtv = calculateLtv(
    formattedCollateral,
    (currentBorrowed + parseFloat(borrowAmount || "0")).toString(),
    XAUT0_PRICE
  );

  const handleBorrow = async () => {
    if (!borrowAmount || parseFloat(borrowAmount) <= 0) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would:
      // 1. Call Morpho Blue borrow function via smart wallet
      // 2. Use Biconomy paymaster for gasless transaction
      
      // For demo purposes, we'll simulate a borrow
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setTxHash("0x" + Math.random().toString(16).slice(2, 42));
    } catch (error) {
      console.error("Borrow error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setMaxBorrow = () => {
    setBorrowAmount(availableToBorrow.toFixed(2));
  };

  const hasCollateral = parseFloat(formattedCollateral) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-500" />
          Borrow USDT
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasCollateral ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">No collateral available</p>
            <p className="text-sm text-gray-500 mt-1">
              You need to deposit XAUT0 as collateral before borrowing
            </p>
          </div>
        ) : (
          <>
            {/* Market Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Borrow APR</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatPercentage(estimatedApr * 100)}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Available Liquidity</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${formatCurrency(formattedLiquidity)}
                </p>
              </div>
            </div>

            {/* Collateral Info */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-amber-700">Your Collateral</span>
                <span className="font-semibold text-amber-900">
                  {formatCurrency(formattedCollateral, 4)} XAUT0
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-amber-600">Value</span>
                <span className="text-amber-800">
                  ${formatCurrency(collateralValue)}
                </span>
              </div>
            </div>

            {/* Borrow Input */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount to Borrow</span>
                <span className="text-gray-500">
                  Max: ${formatCurrency(availableToBorrow)}
                </span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(e.target.value)}
                  className="pr-24 text-lg"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={setMaxBorrow}
                    className="text-xs font-medium text-amber-600 hover:text-amber-700"
                  >
                    MAX
                  </button>
                  <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                    <span className="text-sm font-medium">USDT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LTV Preview */}
            {borrowAmount && parseFloat(borrowAmount) > 0 && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">New LTV</span>
                    <span className={newLtv > 60 ? "text-red-600 font-medium" : "text-gray-900 font-medium"}>
                      {formatPercentage(newLtv)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        newLtv > 60 ? "bg-red-500" : newLtv > 50 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(newLtv, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span>
                    <span>Safe: 67%</span>
                    <span>Liquidation: 86%</span>
                  </div>
                </div>

                {newLtv > 60 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">
                      High LTV warning: Borrowing this amount puts you close to liquidation risk.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                Borrowed USDT will be sent directly to your smart wallet. 
                No gas fees required for this transaction.
              </p>
            </div>

            {/* Borrow Button */}
            <Button
              onClick={handleBorrow}
              isLoading={isLoading}
              disabled={
                !borrowAmount || 
                parseFloat(borrowAmount) <= 0 || 
                parseFloat(borrowAmount) > availableToBorrow ||
                newLtv > 67
              }
              className="w-full"
              size="lg"
            >
              {parseFloat(borrowAmount) > availableToBorrow
                ? "Insufficient Collateral"
                : newLtv > 67
                ? "LTV Too High"
                : "Borrow USDT"}
            </Button>

            {txHash && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-green-700">
                  Borrow successful!{" "}
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
