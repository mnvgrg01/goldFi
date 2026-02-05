"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSmartWallet } from "@/hooks/useSmartWallet";
import { ArrowDownLeft, AlertCircle } from "lucide-react";
import { TOKENS, getExplorerUrl, getNetworkConfig } from "@/lib/constants";

const config = getNetworkConfig();

export function DepositForm() {
  const { smartAccountAddress } = useSmartWallet();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setIsLoading(true);
    try {
      // In a real implementation, this would:
      // 1. Check if user has USDT in their EOA wallet
      // 2. Transfer USDT to the smart wallet
      // 3. Use Biconomy paymaster for gasless transaction

      // For demo purposes, we'll simulate a deposit
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setTxHash("0x" + Math.random().toString(16).slice(2, 42));
    } catch (error) {
      console.error("Deposit error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownLeft className="w-5 h-5 text-green-500" />
          Deposit USDT
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
          <h4 className="font-medium text-blue-900 mb-2">How to deposit</h4>
          <ol className="text-sm text-blue-700 space-y-1.5 list-decimal list-inside">
            <li>Send USDT on {config.name} to your smart wallet address</li>
            <li>The funds will appear in your wallet automatically</li>
            <li>No gas fees required - we sponsor all transactions</li>
          </ol>
        </div>

        {/* Wallet Address Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Your Smart Wallet Address
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-50 px-4 py-3 rounded-xl text-sm font-mono text-gray-700 break-all">
              {smartAccountAddress || "Connect wallet to see address"}
            </code>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            Send USDT ({config.name}) to this address
          </p>
        </div>

        {/* QR Code Placeholder */}
        <div className="flex justify-center">
          <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <span className="text-4xl">📱</span>
              </div>
              <p className="text-xs text-gray-500">Scan to copy address</p>
            </div>
          </div>
        </div>

        {/* Network Info */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">{config.name}</span>
          </div>
          <p className="text-xs text-gray-500">
            Make sure to send USDT on the {config.name} network only. Sending on other networks may result in loss of funds.
          </p>
        </div>

        {txHash && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-sm text-green-700">
              Deposit successful!{" "}
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
