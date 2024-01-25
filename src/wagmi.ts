import { getDefaultWallets } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig } from "wagmi";
import { bsc, mainnet, polygon, bscTestnet } from "wagmi/chains";
// import { infuraProvider } from "@wagmi/core/providers/infura";
import { publicProvider } from "@wagmi/core/providers/public";

const projectId = "296a55745d9880bb16e1386b1b0eb360";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, bsc, polygon, bscTestnet],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "",
  projectId,
  chains,
});

export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains };
