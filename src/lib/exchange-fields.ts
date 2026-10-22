import type { ExchangeId } from "./types";

export type CredentialField = { id: string; label: string; placeholder: string; secret?: boolean; optional?: boolean };

/**
 * Credentials each exchange asks for when connecting an account.
 * Extended matches the live hub (hub.perppilot.app/accounts/new).
 */
export const EXCHANGE_FIELDS: Record<ExchangeId, CredentialField[]> = {
  extended: [
    { id: "apiKey", label: "API key", placeholder: "Insert API key here" },
    { id: "starkPublic", label: "Stark key public", placeholder: "Insert ID here" },
    { id: "starkPrivate", label: "Stark private key", placeholder: "Your private key", secret: true },
    { id: "vault", label: "Vault number", placeholder: "e.g. 100231" },
  ],
  hyperliquid: [
    { id: "agentKey", label: "Agent private key", placeholder: "0x…", secret: true },
    { id: "master", label: "Master account address", placeholder: "0x…" },
    { id: "vault", label: "Vault address", placeholder: "0x…", optional: true },
  ],
  grvt: [
    { id: "apiKey", label: "API key", placeholder: "Insert API key here" },
    { id: "apiSecret", label: "API secret", placeholder: "Your API secret", secret: true },
    { id: "subAccount", label: "Trading account ID", placeholder: "Insert ID here" },
  ],
  lighter: [
    { id: "apiKey", label: "API key private key", placeholder: "0x…", secret: true },
    { id: "accountIndex", label: "Account index", placeholder: "e.g. 42" },
  ],
  nado: [
    { id: "apiKey", label: "Linked signer private key", placeholder: "0x…", secret: true },
    { id: "address", label: "Wallet address", placeholder: "0x…" },
  ],
};

export const requiredFilled = (exchange: ExchangeId, values: Record<string, string>) =>
  EXCHANGE_FIELDS[exchange].every((f) => f.optional || values[f.id]?.trim());
