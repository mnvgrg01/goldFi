"use client";

import { useSmartWallet } from "@/hooks/useSmartWallet";
import { useMorphoPosition, useMorphoMarket, calculateLtv, calculateHealthFactor } from "@/hooks/useMorpho";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { TrendingUp, AlertCircle, Shield } from "lucide-react";

// Mock XAUT0 price - in production would fetch from oracle
const XAUT0_PRICE = 2650; // USD per XAUT0

export function PositionCard() {
  const { smartAccountAddress } = useSmartWallet();
  const { position, formattedCollateral, formattedBorrowShares, isLoading: positionLoading } = 
    useMorphoPosition(smartAccountAddress || undefined);
  const { formattedLiquidity, estimatedApr, isLoading: marketLoading } = useMorphoMarket();

  // Calculate position metrics
  const collateralValue = parseFloat(formattedCollateral) * XAUT0_PRICE;
  // Simplified: assume 1 borrow share = 1 USDT for display
  const borrowedAmount = parseFloat(formattedBorrowShares);
  
  const ltv = calculateLtv(formattedCollateral, borrowedAmount.toString(), XAUT0_PRICE);
  const healthFactor = calculateHealthFactor(formattedCollateral, borrowedAmount.toString(), XAUT0_PRICE);
  const availableToBorrow = Math.max(0, collateralValue * 0.67 - borrowedAmount);

  const isLoading = positionLoading || marketLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasPosition = parseFloat(formattedCollateral) > 0 || borrowedAmount > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          Your Position
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasPosition ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active position</p>
            <p className="text-sm text-gray-400 mt-1">
              Deposit collateral to start borrowing
            </p>
          </div>
        ) : (
          <>
            {/* Collateral & Borrowed */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-xs text-amber-600 mb-1">Collateral</p>
                <p className="text-xl font-bold text-amber-900">
                  {formatCurrency(formattedCollateral, 4)} XAUT0
                </p>
                <p className="text-sm text-amber-600 mt-1">
                  ${formatCurrency(collateralValue)}
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs text-blue-600 mb-1">Borrowed</p>
                <p className="text-xl font-bold text-blue-900">
                  ${formatCurrency(borrowedAmount)}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {formatPercentage(estimatedApr * 100)} APR
                </p>
              </div>
            </div>

            {/* LTV & Health Factor */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">Loan-to-Value (LTV)</span>
                  <span className={ltv > 60 ? "text-red-600 font-medium" : "text-gray-900 font-medium"}>
                    {formatPercentage(ltv)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      ltv > 60 ? "bg-red-500" : ltv > 50 ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(ltv, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Max LTV: 67%</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Health Factor</span>
                </div>
                <span className={`font-medium ${
                  healthFactor < 1.2 ? "text-red-600" : healthFactor < 1.5 ? "text-yellow-600" : "text-green-600"
                }`}>
                  {healthFactor === Infinity ? "∞" : healthFactor.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Available to Borrow */}
            {availableToBorrow > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-green-700">
                  Available to borrow: <span className="font-semibold">${formatCurrency(availableToBorrow)}</span>
                </p>
              </div>
            )}

            {ltv > 60 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  Your position is approaching liquidation risk. Consider adding more collateral or repaying some of your loan.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
