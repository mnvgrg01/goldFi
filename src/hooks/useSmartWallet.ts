"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useState, useEffect, useCallback } from "react";
import { createSmartAccountClient } from "@biconomy/account";
import { http, createWalletClient, custom } from "viem";
import { arbitrum } from "viem/chains";
import { CHAIN_ID } from "@/lib/constants";

export function useSmartWallet() {
  const { user, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const [smartAccount, setSmartAccount] = useState<any>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initSmartAccount = async () => {
      if (!authenticated || !ready || !wallets.length) return;
      
      setIsLoading(true);
      try {
        // Get the embedded wallet from Privy
        const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
        if (!embeddedWallet) {
          console.error("No embedded wallet found");
          return;
        }

        // Switch to Arbitrum
        await embeddedWallet.switchChain(CHAIN_ID);

        // Get the Ethereum provider from the wallet
        const provider = await embeddedWallet.getEthereumProvider();
        
        // Get the wallet address
        const walletAddress = embeddedWallet.address as `0x${string}`;
        
        // Create viem wallet client from provider with account
        const walletClient = createWalletClient({
          account: walletAddress,
          chain: arbitrum,
          transport: custom(provider),
        });

        // Create Biconomy smart account
        const smartAccount = await createSmartAccountClient({
          signer: walletClient,
          biconomyPaymasterApiKey: process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY || "",
          bundlerUrl: `https://bundler.biconomy.io/api/v2/${CHAIN_ID}/${process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_KEY || ""}`,
          rpcUrl: process.env.NEXT_PUBLIC_ARB_RPC_URL || "https://arb1.arbitrum.io/rpc",
        });

        const address = await smartAccount.getAccountAddress();
        setSmartAccount(smartAccount);
        setSmartAccountAddress(address);
      } catch (error) {
        console.error("Error initializing smart account:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initSmartAccount();
  }, [authenticated, ready, wallets]);

  const sendTransaction = useCallback(async (transactions: any[]) => {
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
  }, [smartAccount]);

  return {
    smartAccount,
    smartAccountAddress,
    isLoading,
    sendTransaction,
    isAuthenticated: authenticated && ready,
  };
}
