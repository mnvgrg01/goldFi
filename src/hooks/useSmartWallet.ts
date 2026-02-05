"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useState, useEffect, useCallback } from "react";
import { createSmartAccountClient } from "@biconomy/account";
import {
  http,
  createWalletClient,
  custom,
  createPublicClient,
  type WalletClient
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAIN_ID, getNetworkConfig, isLocalNetwork } from "@/lib/constants";

const config = getNetworkConfig();

// Anvil default account #0 for local testing (DO NOT USE IN PRODUCTION)
// This account has 10,000 ETH on Anvil
const ANVIL_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ANVIL_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

export function useSmartWallet() {
  const { user, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const [smartAccount, setSmartAccount] = useState<any>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocalMode] = useState(isLocalNetwork());

  useEffect(() => {
    const initSmartAccount = async () => {
      // For local testing, use Anvil default account directly (skip Privy)
      if (isLocalMode) {
        console.log("🔧 Local mode: Using Anvil default account (bypassing Privy)");

        const anvilAccount = privateKeyToAccount(ANVIL_PRIVATE_KEY as `0x${string}`);
        const client = createWalletClient({
          account: anvilAccount,
          chain: config.chain,
          transport: http(config.rpcUrl),
        });

        setWalletClient(client);
        setSmartAccountAddress(ANVIL_ADDRESS);
        setSmartAccount(null);
        return;
      }

      // Production mode: use Privy wallet
      if (!authenticated || !ready || !wallets.length) return;

      setIsLoading(true);
      try {
        const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
        if (!embeddedWallet) {
          console.error("No embedded wallet found");
          return;
        }

        await embeddedWallet.switchChain(CHAIN_ID);
        const provider = await embeddedWallet.getEthereumProvider();
        const walletAddress = embeddedWallet.address as `0x${string}`;

        const client = createWalletClient({
          account: walletAddress,
          chain: config.chain,
          transport: custom(provider),
        });

        setWalletClient(client);

        // Create Biconomy smart account for production
        const biconomyAccount = await createSmartAccountClient({
          signer: client,
          biconomyPaymasterApiKey: process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY || "",
          bundlerUrl: `https://bundler.biconomy.io/api/v2/${CHAIN_ID}/${process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_KEY || ""}`,
          rpcUrl: config.rpcUrl,
        });

        const address = await biconomyAccount.getAccountAddress();
        setSmartAccount(biconomyAccount);
        setSmartAccountAddress(address);
      } catch (error) {
        console.error("Error initializing smart account:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initSmartAccount();
  }, [authenticated, ready, wallets, isLocalMode]);

  /**
   * Send transactions via Anvil (local) or Biconomy smart account (production)
   */
  const sendTransaction = useCallback(async (transactions: any[]): Promise<string> => {
    // Local mode: send transactions directly via Anvil wallet (NO Privy modal!)
    if (isLocalMode && walletClient) {
      console.log("📤 Sending transactions via Anvil wallet...");

      const publicClient = createPublicClient({
        chain: config.chain,
        transport: http(config.rpcUrl),
      });

      let lastHash = "";

      for (const tx of transactions) {
        console.log("  → Sending to:", tx.to);
        const hash = await walletClient.sendTransaction({
          to: tx.to,
          data: tx.data,
          value: tx.value || BigInt(0),
        });

        console.log("  ⏳ Waiting for confirmation:", hash);
        await publicClient.waitForTransactionReceipt({ hash });
        lastHash = hash;
        console.log("  ✅ Transaction confirmed:", hash);
      }

      return lastHash;
    }

    // Production mode: use Biconomy smart account
    if (!smartAccount) {
      throw new Error("Smart account not initialized");
    }

    try {
      const userOpResponse = await smartAccount.sendTransaction(transactions, {
        paymasterServiceData: {
          mode: "SPONSORED",
        },
      });

      const { transactionHash } = await userOpResponse.waitForTxHash();
      return transactionHash;
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw error;
    }
  }, [smartAccount, walletClient, isLocalMode]);

  return {
    smartAccount,
    smartAccountAddress,
    isLoading: isLocalMode ? false : isLoading,
    sendTransaction,
    isAuthenticated: isLocalMode ? true : (authenticated && ready),
    isLocalMode,
  };
}
