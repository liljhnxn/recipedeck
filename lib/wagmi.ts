import { http, createConfig } from "wagmi";
import { botchainTestnet } from "./chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [botchainTestnet],
  connectors: [
    injected({
      target: "metaMask",
    }),
    injected(),
  ],
  transports: {
    [botchainTestnet.id]: http("https://rpc.bohr.life"),
  },
  ssr: true,
});

