import type { ExchangeId } from "./types";

/*
 * Copy for the "Setup your profile" flow: one line per exchange and the steps to
 * get its keys. Draft text for the first-access test; the key steps still need
 * the real paths from each exchange.
 */

export type ExchangeGuide = {
  id: ExchangeId;
  /** One short line on the pick screen. */
  short: string;
  effort: "Easy" | "Medium" | "Advanced";
  recommended?: boolean;
  /** Where to find the keys, after the account exists. */
  steps: string[];
};

/** In the order the flow shows them: Nado first, it is the easiest start. */
export const SETUP_EXCHANGES: ExchangeGuide[] = [
  {
    id: "nado",
    short: "The easiest to set up. Made for your first bot.",
    effort: "Easy",
    recommended: true,
    steps: ["In Nado, open Settings and create a linked signer.", "Copy the signer private key and your wallet address."],
  },
  {
    id: "hyperliquid",
    short: "The biggest on-chain exchange",
    effort: "Medium",
    steps: ["Open More, then API, and generate an API wallet.", "Copy the API wallet private key and your account address."],
  },
  {
    id: "lighter",
    short: "Very low trading fees",
    effort: "Medium",
    steps: ["Open Settings, then API keys, and create a key.", "Copy the API key private key and the account index."],
  },
  {
    id: "extended",
    short: "Takes the longest to connect",
    effort: "Advanced",
    steps: ["Open the API management page and create an API key.", "Copy the API key, both Stark keys and the vault number."],
  },
];

export const guideFor = (id: ExchangeId) => SETUP_EXCHANGES.find((g) => g.id === id) ?? SETUP_EXCHANGES[0];
