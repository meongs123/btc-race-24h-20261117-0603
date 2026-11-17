// 60-minute dip-bounce bot for the BTC race (cbBTC/USDC, 1-minute bars).
//
// Dev window (16-17 Nov 2026) is a quiet sideways tape: mean |1m move| 4.3 bps,
// ZERO 1-minute drops >= 50 bps, total return only +49 bps. The old 1-minute
// dip bot has almost nothing to buy. The money is in slow 60-minute drawdowns
// of 110+ bps that snap back +180 bps over the next hours (three such V-shapes
// in the window, e.g. ~64,700 -> 63,948 -> 65,116).
//
// Rules (all BigInt, no floats, no clock, no randomness, deterministic):
// - Buy the full cash when the close falls DROP_BPS or more vs the close
//   K_BARS ago (a 60-minute drawdown, not a 1-minute flicker).
// - Sell the whole position at +TP_BPS above the entry close (take profit),
//   -SL_BPS below it (stop loss), or -TRAIL_BPS below the peak close since
//   entry (trailing stop: locks in a bounce that fades before TP).
// - After a stop-loss exit, wait 30 bars before re-entering: the tape is
//   still falling then, and an instant re-buy just re-buys the same knife.
//   (Inert on the dev window, where no stop ever fired; it protects the
//   race window against repeated stop-loss bleed in a downtrend.)
//   70 bps, so the bot still takes at least one trade on a quiet race window
//   (the race guardrail needs >= 1 trade). Inert on the dev window.
// - Orders fill at the next bar's open; TP/SL/trail are wide vs the ~36 bps
//   round-trip cost (4 fee + 2 slip + ~13 impact per leg, calibrated so the
//   Python model reproduces the official buy-and-hold grade $1.067 exactly).

import { runBars, type BarsState } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const K_BARS = 60;
const DROP_BPS = 110n;
const FALLBACK_BAR = 900;
const FALLBACK_DROP_BPS = 70n;
const TAKE_PROFIT_BPS = 180n;
const STOP_LOSS_BPS = 80n;
const TRAIL_BPS = 100n;
const MAX_SLIPPAGE_BPS = 300;
const MIN_NOTIONAL = 1_000_000n;

const closes: bigint[] = [];
let entryPrice: bigint | null = null;
let peakPrice: bigint | null = null;
let hasTraded = false;
let tradable = 0;
let cooldownUntil = 0;

await runBars({
  onBatch(state: BarsState) {
    if (state.warmingUp) return [];
    tradable += 1;
    const close = state.close(SYMBOL);
    if (close === null) return [];
    closes.push(close);
    // Bounded history: only the last K_BARS + 1 closes are ever needed
    // (the reference close K bars ago), so drop older bars instead of
    // growing the array for the whole 1,440-bar window.
    if (closes.length > K_BARS + 1) closes.shift();
    const orders: { side: 'buy'; symbol: string; notional_quote_units: bigint; max_slippage_bps: number }[] = [];
    const sells: { side: 'sell'; symbol: string; qty: bigint; max_slippage_bps: number }[] = [];
    const holding = state.positions.get(SYMBOL);
    const inPosition = holding !== undefined && holding.qty > 0n;
    if (closes.length > K_BARS) {
      const ref = closes[closes.length - 1 - K_BARS];
      const dropBps = ((close - ref) * 10000n) / ref;
      if (!inPosition) {
        const thr = (!hasTraded && tradable >= FALLBACK_BAR) ? FALLBACK_DROP_BPS : DROP_BPS;
        if (tradable > cooldownUntil && dropBps <= -thr && state.cash >= MIN_NOTIONAL) {
          orders.push({ side: 'buy', symbol: SYMBOL, notional_quote_units: state.cash, max_slippage_bps: MAX_SLIPPAGE_BPS });
          entryPrice = close;
          peakPrice = close;
          hasTraded = true;
        }
      } else if (entryPrice !== null && peakPrice !== null) {
        if (close > peakPrice) peakPrice = close;
        const tp = close * 10000n >= entryPrice * (10000n + TAKE_PROFIT_BPS);
        const sl = close * 10000n <= entryPrice * (10000n - STOP_LOSS_BPS);
        const tr = close * 10000n <= peakPrice * (10000n - TRAIL_BPS);
        if (tp || sl || tr) {
          // After a stop-loss exit the tape is still falling: wait 30 bars
          // before re-entering so the bot does not re-buy the same knife.
          // TP / trailing exits carry no cooldown (the bounce already paid).
          if (sl) cooldownUntil = tradable + 30;
          sells.push({ side: 'sell', symbol: SYMBOL, qty: holding.qty, max_slippage_bps: MAX_SLIPPAGE_BPS });
          entryPrice = null;
          peakPrice = null;
        }
      }
    }
    return [...sells, ...orders];
  },
});
