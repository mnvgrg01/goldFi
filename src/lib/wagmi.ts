import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { arbitrum } from "viem/chains";
import { defineChain } from "viem";

// Get RPC URL from environment
const rpcUrl = process.env.NEXT_PUBLIC_ARB_RPC_URL || "https://arb1.arbitrum.io/rpc";
const isLocalHost = rpcUrl.includes("localhost") || rpcUrl.includes("127.0.0.1");

// Define custom chain with the correct RPC URL
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

export const wagmiConfig = createConfig({
  chains: [activeChain],
  transports: {
    [activeChain.id]: http(rpcUrl),
  },
});
