import type { ExchangeId } from "./types";

/*
 * Copy for the "Setup your profile" flow: what each exchange is, who it suits and
 * how to get its keys. Draft text for the first-access test; the key steps still
 * need the real paths from each exchange.
 */

export type ExchangeGuide = {
  id: ExchangeId;
  summary: string;
  bestFor: string;
  effort: "Easy" | "Medium" | "Advanced";
  recommended?: boolean;
  steps: string[];
};

/** In the order the flow shows them: Nado first, it is the easiest start. */
export const SETUP_EXCHANGES: ExchangeGuide[] = [
  {
    id: "nado",
    summary: "The simplest exchange to start with: you sign in with a wallet and connect it to PerpPilot with two values.",
    bestFor: "Your first bot, even if you never used a crypto exchange",
    effort: "Easy",
    recommended: true,
    steps: ["In Nado, open Settings and create a linked signer.", "Copy the signer private key and your wallet address into the form."],
  },
  {
    id: "hyperliquid",
    summary: "The largest on-chain perps exchange, with many markets and deep order books. You connect it with an API wallet.",
    bestFor: "Bigger positions and more markets",
    effort: "Medium",
    steps: ["Open More, then API, and generate an API wallet.", "Copy the API wallet private key and your account address into the form."],
  },
  {
    id: "lighter",
    summary: "Very low trading fees. You connect it with an API key and your account index.",
    bestFor: "Keeping trading fees low",
    effort: "Medium",
    steps: ["Open Settings, then API keys, and create a key.", "Copy the API key private key and the account index into the form."],
  },
  {
    id: "extended",
    summary: "It asks for four values from its API page, so it takes the longest to connect.",
    bestFor: "Traders who already use Extended",
    effort: "Advanced",
    steps: ["Open the API management page and create an API key.", "Copy the API key, both Stark keys and the vault number into the form."],
  },
];

export const guideFor = (id: ExchangeId) => SETUP_EXCHANGES.find((g) => g.id === id) ?? SETUP_EXCHANGES[0];
