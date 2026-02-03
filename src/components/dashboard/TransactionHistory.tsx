"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { History, ArrowDownLeft, ArrowUpRight, Repeat, Wallet } from "lucide-react";
import { formatCurrency, truncateAddress } from "@/lib/utils";

// Mock transaction history - in production would fetch from indexer
interface Transaction {
  id: string;
  type: "deposit" | "withdraw" | "swap" | "borrow" | "repay" | "addCollateral" | "removeCollateral";
  amount: string;
  token: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
  hash: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "deposit",
    amount: "1000",
    token: "USDT",
    timestamp: "2024-01-15T10:30:00Z",
    status: "completed",
    hash: "0x1234...5678",
  },
  {
    id: "2",
    type: "swap",
    amount: "500",
    token: "USDT → XAUT0",
    timestamp: "2024-01-15T10:35:00Z",
    status: "completed",
    hash: "0xabcd...efgh",
  },
  {
    id: "3",
    type: "addCollateral",
    amount: "0.1887",
    token: "XAUT0",
    timestamp: "2024-01-15T10:40:00Z",
    status: "completed",
    hash: "0x9876...5432",
  },
  {
    id: "4",
    type: "borrow",
    amount: "300",
    token: "USDT",
    timestamp: "2024-01-15T10:45:00Z",
    status: "completed",
    hash: "0xijkl...mnop",
  },
];

const getTransactionIcon = (type: Transaction["type"]) => {
  switch (type) {
    case "deposit":
      return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
    case "withdraw":
      return <ArrowUpRight className="w-4 h-4 text-red-500" />;
    case "swap":
      return <Repeat className="w-4 h-4 text-amber-500" />;
    case "borrow":
      return <Wallet className="w-4 h-4 text-blue-500" />;
    case "repay":
      return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    case "addCollateral":
      return <ArrowDownLeft className="w-4 h-4 text-amber-500" />;
    case "removeCollateral":
      return <ArrowUpRight className="w-4 h-4 text-red-500" />;
    default:
      return <History className="w-4 h-4 text-gray-500" />;
  }
};

const getTransactionLabel = (type: Transaction["type"]) => {
  switch (type) {
    case "deposit":
      return "Deposit";
    case "withdraw":
      return "Withdraw";
    case "swap":
      return "Swap";
    case "borrow":
      return "Borrow";
    case "repay":
      return "Repay";
    case "addCollateral":
      return "Add Collateral";
    case "removeCollateral":
      return "Remove Collateral";
    default:
      return "Transaction";
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export function TransactionHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-500" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mockTransactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mockTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {getTransactionLabel(tx.type)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(tx.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {tx.type === "swap" ? (
                      tx.token
                    ) : (
                      `${parseFloat(tx.amount) >= 0 ? "+" : ""}${formatCurrency(tx.amount)} ${tx.token}`
                    )}
                  </p>
                  <a
                    href={`https://arbiscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-600 hover:text-amber-700"
                  >
                    View →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
