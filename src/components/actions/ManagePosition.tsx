"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSmartWallet } from "@/hooks/useSmartWallet";
import { useMorphoPosition, calculateLtv, calculateHealthFactor } from "@/hooks/useMorpho";
import { useTokenBalance } from "@/hooks/useTokens";
import { TOKENS, DECIMALS, MORPHO } from "@/lib/constants";
import { Settings2, Plus, Minus, RotateCcw, AlertTriangle } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { parseUnits } from "viem";

type ActionType = "repay" | "addCollateral" | "withdrawCollateral";

// Mock XAUT0 price - in production would fetch from oracle
const XAUT0_PRICE = 2650;

export function ManagePosition() {
  const { smartAccountAddress } = useSmartWallet();
  const { position, formattedCollateral, formattedBorrowShares, refetch } = 
    useMorphoPosition(smartAccountAddress || undefined);
  const { formattedBalance: usdtBalance } = useTokenBalance(
    TOKENS.USDT,
    smartAccountAddress || undefined
  );
  const { formattedBalance: xautBalance } = useTokenBalance(
    TOKENS.XAUT0,
    smartAccountAddress || undefined
  );

  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Calculate position metrics
  const collateralValue = parseFloat(formattedCollateral) * XAUT0_PRICE;
  const borrowedAmount = parseFloat(formattedBorrowShares?.toString() || "0");
  const currentLtv = calculateLtv(formattedCollateral, borrowedAmount.toString(), XAUT0_PRICE);

  const handleAction = async () => {
    if (!amount || parseFloat(amount) <= 0 || !activeAction) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would call the appropriate Morpho function
      // via the smart wallet with Biconomy paymaster
      
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setTxHash("0x" + Math.random().toString(16).slice(2, 42));
      refetch();
    } catch (error) {
      console.error("Action error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPosition = parseFloat(formattedCollateral) > 0 || borrowedAmount > 0;

  const renderActionContent = () => {
    switch (activeAction) {
      case "repay":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Repay Amount</span>
                <span className="text-gray-500">
                  Borrowed: ${formatCurrency(borrowedAmount)}
                </span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-24 text-lg"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={() => setAmount(Math.min(parseFloat(usdtBalance), borrowedAmount).toString())}
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
                Balance: {formatCurrency(usdtBalance, 2)} USDT
              </p>
            </div>

            <Button
              onClick={handleAction}
              isLoading={isLoading}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(usdtBalance)}
              className="w-full"
            >
              {parseFloat(amount) > parseFloat(usdtBalance)
                ? "Insufficient Balance"
                : "Repay Loan"}
            </Button>
          </div>
        );

      case "addCollateral":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Add Collateral</span>
                <span className="text-gray-500">
                  Balance: {formatCurrency(xautBalance, 4)} XAUT0
                </span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-24 text-lg"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={() => setAmount(xautBalance)}
                    className="text-xs font-medium text-amber-600 hover:text-amber-700"
                  >
                    MAX
                  </button>
                  <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-lg">
                    <span className="text-sm font-medium text-amber-900">XAUT0</span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleAction}
              isLoading={isLoading}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(xautBalance)}
              className="w-full"
            >
              {parseFloat(amount) > parseFloat(xautBalance)
                ? "Insufficient Balance"
                : "Add Collateral"}
            </Button>
          </div>
        );

      case "withdrawCollateral":
        const maxWithdraw = parseFloat(formattedCollateral) * (1 - (currentLtv / 100) / 0.67);
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Withdraw Collateral</span>
                <span className="text-gray-500">
                  Max: {formatCurrency(Math.max(0, maxWithdraw), 4)} XAUT0
                </span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-24 text-lg"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={() => setAmount(Math.max(0, maxWithdraw).toString())}
                    className="text-xs font-medium text-amber-600 hover:text-amber-700"
                  >
                    MAX
                  </button>
                  <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-lg">
                    <span className="text-sm font-medium text-amber-900">XAUT0</span>
                  </div>
                </div>
              </div>
            </div>

            {parseFloat(amount) > maxWithdraw && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  Withdrawing this amount would put your position at risk of liquidation.
                </p>
              </div>
            )}

            <Button
              onClick={handleAction}
              isLoading={isLoading}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxWithdraw}
              className="w-full"
            >
              {parseFloat(amount) > maxWithdraw
                ? "Would Exceed LTV"
                : "Withdraw Collateral"}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-gray-500" />
          Manage Position
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasPosition ? (
          <div className="text-center py-8">
            <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active position to manage</p>
          </div>
        ) : (
          <>
            {/* Position Summary */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Collateral</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(formattedCollateral, 4)} XAUT0
                  </p>
                  <p className="text-xs text-gray-500">
                    ${formatCurrency(collateralValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Borrowed</p>
                  <p className="font-semibold text-gray-900">
                    ${formatCurrency(borrowedAmount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    LTV: {formatPercentage(currentLtv)}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { setActiveAction("repay"); setAmount(""); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  activeAction === "repay"
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Minus className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">Repay</span>
              </button>
              <button
                onClick={() => { setActiveAction("addCollateral"); setAmount(""); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  activeAction === "addCollateral"
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Plus className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">Add Coll.</span>
              </button>
              <button
                onClick={() => { setActiveAction("withdrawCollateral"); setAmount(""); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  activeAction === "withdrawCollateral"
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Minus className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium">Withdraw</span>
              </button>
            </div>

            {/* Action Form */}
            {activeAction && renderActionContent()}

            {txHash && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-green-700">
                  Transaction successful!{" "}
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
