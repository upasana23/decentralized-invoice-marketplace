"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { polygonAmoy } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import "@rainbow-me/rainbowkit/styles.css";

// Custom dark theme matching InvoChain UI
const rainbowKitTheme = darkTheme({
  accentColor: "oklch(0.65 0.2 250)", // Primary blue
  accentColorForeground: "oklch(0.98 0.01 240)", // White text
  borderRadius: "medium",
  fontStack: "system",
  overlayBlur: "small",
});

// Configure wagmi with only Polygon Amoy
const config = createConfig({
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_RPC_URL || "https://rpc-amoy.polygon.technology"),
  },
  connectors: [
    injected({
      target: "metaMask",
    }),
  ],
  ssr: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={rainbowKitTheme}
          initialChain={polygonAmoy}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

