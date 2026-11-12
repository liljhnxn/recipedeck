import { defineChain } from "viem";

export const botchain = defineChain({
  id: 677,
  name: "Botchain",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.botchain.ai"],
    },
    public: {
      http: ["https://rpc.botchain.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "Botchain Scan",
      url: "https://scan.botchain.ai",
    },
  },
});

// Alias for convenience
export const botchainMainnet = botchain;
