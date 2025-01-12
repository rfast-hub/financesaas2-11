export const SUPPORTED_CRYPTOCURRENCIES = [
  { id: "bitcoin", name: "Bitcoin (BTC)" },
  { id: "ethereum", name: "Ethereum (ETH)" },
  { id: "cardano", name: "Cardano (ADA)" },
  { id: "solana", name: "Solana (SOL)" },
  { id: "polkadot", name: "Polkadot (DOT)" },
  { id: "ripple", name: "XRP" },
  { id: "dogecoin", name: "Dogecoin (DOGE)" },
  { id: "avalanche-2", name: "Avalanche (AVAX)" },
  { id: "chainlink", name: "Chainlink (LINK)" },
  { id: "polygon", name: "Polygon (MATIC)" },
] as const;

export type SupportedCryptocurrency = typeof SUPPORTED_CRYPTOCURRENCIES[number]["id"];