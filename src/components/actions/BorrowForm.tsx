"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSmartWallet } from "@/hooks/useSmartWallet";
import { useMorphoPosition, useMorphoMarket, calculateMaxBorrow, calculateLtv } from "@/hooks/useMorpho";
import { useTokenBalance } from "@/hooks/useTokens";
import { TOKENS, DECIMALS, MAX_LTV, MORPHO, getExplorerUrl } from "@/lib/constants";
import { ERC20_ABI, MORPHO_BLUE_ABI } from "@/lib/abis";
import { Wallet, AlertTriangle, Info, Plus } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { parseUnits, encodeFunctionData, type Address } from "viem";

// Mock XAUT0 price - in production would fetch from oracle
const XAUT0_PRICE = 2650;

type BorrowStep = "idle" | "supplying" | "borrowing";

export function BorrowForm() {
  const { smartAccountAddress, sendTransaction } = useSmartWallet();
  const { position, formattedCollateral, formattedBorrowAssets, refetch: refetchPosition } = useMorphoPosition(smartAccountAddress || undefined);
  const { formattedLiquidity, estimatedApr } = useMorphoMarket();
  const { formattedBalance: xautBalance, refetch: refetchXaut } = useTokenBalance(
    TOKENS.XAUT0,
    smartAccountAddress || undefined
  );
  const { refetch: refetchUsdt } = useTokenBalance(
    TOKENS.USDT,
    smartAccountAddress || undefined
  );

  const [collateralAmount, setCollateralAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<BorrowStep>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"supply" | "borrow">("supply");

  // Calculate max borrowable amount based on existing + new collateral
  const existingCollateralValue = parseFloat(formattedCollateral) * XAUT0_PRICE;
  const newCollateralValue = parseFloat(collateralAmount || "0") * XAUT0_PRICE;
  const totalCollateralValue = existingCollateralValue + newCollateralValue;
  const maxBorrow = totalCollateralValue * MAX_LTV;

  // Current borrowed amount (using calculated assets, not shares)
  const currentBorrowed = parseFloat(formattedBorrowAssets || "0");
  const availableToBorrow = Math.max(0, maxBorrow - currentBorrowed);

  // Calculate new LTV if borrowing
  const newLtv = calculateLtv(
    (parseFloat(formattedCollateral) + parseFloat(collateralAmount || "0")).toString(),
    (currentBorrowed + parseFloat(borrowAmount || "0")).toString(),
    XAUT0_PRICE
  );

  const hasCollateral = parseFloat(formattedCollateral) > 0;
  const hasXautBalance = parseFloat(xautBalance) > 0;

  /**
   * Build transaction to supply collateral
   */
  const buildSupplyCollateralTx = (amount: bigint, onBehalf: Address) => {
    const marketParams = {
      loanToken: MORPHO.MARKET.loanToken as Address,
      collateralToken: MORPHO.MARKET.collateralToken as Address,
      oracle: MORPHO.MARKET.oracle as Address,
      irm: MORPHO.MARKET.irm as Address,
      lltv: MORPHO.MARKET.lltv,
    };

    // Approval tx
    const approveTx = {
      to: TOKENS.XAUT0 as Address,
      data: encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "approve",
        args: [MORPHO.BLUE as Address, amount],
      }),
      value: BigInt(0),
    };

    // Supply collateral tx
    const supplyTx = {
      to: MORPHO.BLUE as Address,
      data: encodeFunctionData({
        abi: MORPHO_BLUE_ABI,
        functionName: "supplyCollateral",
        args: [marketParams, amount, onBehalf, "0x"],
      }),
      value: BigInt(0),
    };

    return [approveTx, supplyTx];
  };

  /**
   * Build transaction to borrow
   */
  const buildBorrowTx = (amount: bigint, onBehalf: Address, receiver: Address) => {
    const marketParams = {
      loanToken: MORPHO.MARKET.loanToken as Address,
      collateralToken: MORPHO.MARKET.collateralToken as Address,
      oracle: MORPHO.MARKET.oracle as Address,
      irm: MORPHO.MARKET.irm as Address,
      lltv: MORPHO.MARKET.lltv,
    };

    return {
      to: MORPHO.BLUE as Address,
      data: encodeFunctionData({
        abi: MORPHO_BLUE_ABI,
        functionName: "borrow",
        args: [marketParams, amount, BigInt(0), onBehalf, receiver],
      }),
      value: BigInt(0),
    };
  };

  const handleSupplyCollateral = async () => {
    if (!collateralAmount || parseFloat(collateralAmount) <= 0 || !smartAccountAddress) return;

    setIsLoading(true);
    setError(null);
    setTxHash(null);
    setCurrentStep("supplying");

    try {
      const amount = parseUnits(collateralAmount, DECIMALS.XAUT0);
      const transactions = buildSupplyCollateralTx(amount, smartAccountAddress as Address);

      const hash = await sendTransaction(transactions);
      setTxHash(hash);
      setCollateralAmount("");

      // Refresh balances
      setTimeout(() => {
        refetchPosition();
        refetchXaut();
      }, 2000);

    } catch (err: any) {
      console.error("Supply error:", err);
      setError(err.message || "Failed to supply collateral");
    } finally {
      setIsLoading(false);
      setCurrentStep("idle");
    }
  };

  const handleBorrow = async () => {
    if (!borrowAmount || parseFloat(borrowAmount) <= 0 || !smartAccountAddress) return;

    setIsLoading(true);
    setError(null);
    setTxHash(null);
    setCurrentStep("borrowing");

    try {
      const amount = parseUnits(borrowAmount, DECIMALS.USDT);
      const borrowTx = buildBorrowTx(
        amount,
        smartAccountAddress as Address,
        smartAccountAddress as Address
      );

      const hash = await sendTransaction([borrowTx]);
      setTxHash(hash);
      setBorrowAmount("");

      // Refresh balances
      setTimeout(() => {
        refetchPosition();
        refetchUsdt();
      }, 2000);

    } catch (err: any) {
      console.error("Borrow error:", err);
      setError(err.message || "Failed to borrow");
    } finally {
      setIsLoading(false);
      setCurrentStep("idle");
    }
  };

  const setMaxCollateral = () => {
    setCollateralAmount(xautBalance);
  };

  const setMaxBorrowAmount = () => {
    setBorrowAmount(availableToBorrow.toFixed(2));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-500" />
          Collateral & Borrow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setMode("supply")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${mode === "supply"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Supply Collateral
          </button>
          <button
            onClick={() => setMode("borrow")}
            disabled={!hasCollateral}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${mode === "borrow"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900 disabled:opacity-50"
              }`}
          >
            <Wallet className="w-4 h-4 inline mr-1" />
            Borrow USDT
          </button>
        </div>

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

        {/* Current Position */}
        {hasCollateral && (
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
                ${formatCurrency(existingCollateralValue)}
              </span>
            </div>
            {currentBorrowed > 0 && (
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-amber-600">Current Debt</span>
                <span className="text-amber-800">
                  ${formatCurrency(currentBorrowed)}
                </span>
              </div>
            )}
          </div>
        )}

        {mode === "supply" ? (
          /* Supply Collateral Form */
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">XAUT0 to Supply</span>
                <span className="text-gray-500">
                  Balance: {formatCurrency(xautBalance, 4)} XAUT0
                </span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={collateralAmount}
                  onChange={(e) => setCollateralAmount(e.target.value)}
                  className="pr-24 text-lg"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={setMaxCollateral}
                    className="text-xs font-medium text-amber-600 hover:text-amber-700"
                  >
                    MAX
                  </button>
                  <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-lg">
                    <span className="text-sm font-medium text-amber-900">XAUT0</span>
                  </div>
                </div>
              </div>
              {collateralAmount && (
                <p className="text-xs text-gray-500">
                  ≈ ${formatCurrency(parseFloat(collateralAmount || "0") * XAUT0_PRICE)}
                </p>
              )}
            </div>

            {!hasXautBalance && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  You need XAUT0 to supply as collateral. Swap USDT → XAUT0 first.
                </p>
              </div>
            )}

            <Button
              onClick={handleSupplyCollateral}
              isLoading={isLoading && currentStep === "supplying"}
              disabled={!collateralAmount || parseFloat(collateralAmount) <= 0 || parseFloat(collateralAmount) > parseFloat(xautBalance)}
              className="w-full"
              size="lg"
            >
              {parseFloat(collateralAmount) > parseFloat(xautBalance)
                ? "Insufficient Balance"
                : "Supply Collateral"}
            </Button>
          </>
        ) : (
          /* Borrow Form */
          <>
            {!hasCollateral ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">No collateral available</p>
                <p className="text-sm text-gray-500 mt-1">
                  Supply XAUT0 as collateral before borrowing
                </p>
              </div>
            ) : (
              <>
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
                        onClick={setMaxBorrowAmount}
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
                          className={`h-full rounded-full transition-all ${newLtv > 60 ? "bg-red-500" : newLtv > 50 ? "bg-yellow-500" : "bg-green-500"
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

                <Button
                  onClick={handleBorrow}
                  isLoading={isLoading && currentStep === "borrowing"}
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
              </>
            )}
          </>
        )}

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            {mode === "supply"
              ? "Supplied collateral earns no yield but enables borrowing."
              : "Borrowed USDT will be sent directly to your smart wallet. No gas fees required."}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {txHash && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-sm text-green-700">
              Transaction successful!{" "}
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
