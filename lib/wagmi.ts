import { http, createConfig } from "wagmi";
import { botchain } from "./chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [botchain],
  connectors: [
    injected({
      target: "metaMask",
    }),
    injected(),
  ],
  transports: {
    [botchain.id]: http("https://rpc.botchain.ai"),
  },
  ssr: true,
});
