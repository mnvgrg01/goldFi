"use client";

import { useSmartWallet } from "@/hooks/useSmartWallet";
import { useTokenBalance, useNativeBalance } from "@/hooks/useTokens";
import { TOKENS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, truncateAddress } from "@/lib/utils";
import { Copy, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export function WalletInfo() {
  const { smartAccountAddress, isLoading } = useSmartWallet();
  const { formattedBalance: usdtBalance } = useTokenBalance(
    TOKENS.USDT,
    smartAccountAddress || undefined
  );
  const { formattedBalance: xautBalance } = useTokenBalance(
    TOKENS.XAUT0,
    smartAccountAddress || undefined
  );
  const { formattedBalance: ethBalance } = useNativeBalance(
    smartAccountAddress || undefined
  );

  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (smartAccountAddress) {
      navigator.clipboard.writeText(smartAccountAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-amber-500" />
          Smart Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wallet Address */}
        <div>
          <p className="text-sm text-gray-500 mb-1.5">Wallet Address</p>
          <div className="flex items-center gap-2">
            <code className="bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-mono text-gray-700">
              {smartAccountAddress ? truncateAddress(smartAccountAddress) : "Not connected"}
            </code>
            {smartAccountAddress && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="h-8 w-8 p-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            )}
            {copied && (
              <span className="text-xs text-green-600">Copied!</span>
            )}
          </div>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">USDT Balance</p>
            <p className="text-lg font-semibold text-gray-900">
              ${formatCurrency(usdtBalance, 2)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">XAUT0 Balance</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(xautBalance, 4)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">ETH Balance</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(ethBalance, 4)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
