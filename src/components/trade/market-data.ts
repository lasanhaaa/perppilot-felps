/** Venues and markets on the Trade screen, as listed on the live hub. */
export type VenueId = "extended" | "hyperliquid" | "lighter" | "robinhood-lighter" | "phemex";

export type Venue = { id: VenueId; name: string; short: string; lagMs: number | null; offset: number; change: number };

export const VENUES: Venue[] = [
  { id: "extended", name: "Extended", short: "Ext", lagMs: 158, offset: -88, change: -0.108 },
  { id: "hyperliquid", name: "Hyperliquid", short: "HL", lagMs: 364, offset: 0, change: 0 },
  { id: "lighter", name: "Lighter", short: "Ltr", lagMs: 143, offset: -3.4, change: -0.004 },
  { id: "robinhood-lighter", name: "Robinhood Lighter", short: "RH", lagMs: null, offset: -28, change: -0.034 },
  { id: "phemex", name: "Phemex", short: "Phx", lagMs: null, offset: -4.2, change: -0.005 },
];

export type Market = { id: string; base: string; price: number; mark: number; funding: number; change24h: number; openInterest: number; volume24h: number; tick: number; seed: number };

export const MARKETS: Market[] = [
  { id: "BTC-USD", base: "BTC", price: 81348, mark: 81344.5, funding: 0.0013, change24h: -3.8, openInterest: 3_534_100_953, volume24h: 3_574_912_097, tick: 1, seed: 81 },
  { id: "ETH-USD", base: "ETH", price: 3412.4, mark: 3411.9, funding: 0.0021, change24h: -2.4, openInterest: 1_822_410_220, volume24h: 1_640_118_904, tick: 0.1, seed: 34 },
  { id: "SOL-USD", base: "SOL", price: 148.92, mark: 148.9, funding: -0.0007, change24h: 1.6, openInterest: 512_730_118, volume24h: 701_244_560, tick: 0.01, seed: 14 },
];

export const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];
