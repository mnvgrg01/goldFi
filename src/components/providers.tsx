"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import { arbitrum } from "viem/chains";
import { defineChain } from "viem";

const queryClient = new QueryClient();

// Get RPC URL from environment
const rpcUrl = process.env.NEXT_PUBLIC_ARB_RPC_URL || "https://arb1.arbitrum.io/rpc";
const isLocalHost = rpcUrl.includes("localhost") || rpcUrl.includes("127.0.0.1");

// Define custom chain with the correct RPC URL for Privy
// This ensures Privy uses localhost:8545 for balance checks and transactions
const arbitrumWithCustomRpc = defineChain({
  ...arbitrum,
  rpcUrls: {
    default: {
      http: [rpcUrl],
    },
  },
});

// Use the chain that matches our environment
const activeChain = isLocalHost ? arbitrumWithCustomRpc : arbitrum;

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      clientId="client-WY6VpdC61SPmbNxq8eV9i1ToUF91q29NFmnnuRFQ4VH8p"
      config={{
        loginMethods: ["email"],
        appearance: {
          theme: "light",
          accentColor: "#F59E0B",
          logo: "/logo.png",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        // Use custom chain with localhost RPC when in development
        defaultChain: activeChain,
        supportedChains: [activeChain],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
