# btc-race-24h-20261117-0603

Bot for make.fun "Race a BTC trading bot live for 24 hours"
(btc-race-24h-20261117-0603): trades cbBTC/USDC on 1-minute bars, $1,000 paper.

Strategy: 60-minute dip-bounce. The dev window is a quiet sideways tape
(mean |1m move| 4.3 bps, zero 1-minute drops >= 50 bps), so the bot buys a
slow 60-minute drawdown of 110+ bps and rides the snap-back: take profit
+180 bps, stop loss -80 bps, trailing stop -100 bps from the peak since
entry. Fallback trigger 70 bps after bar 900 if no trade yet (race-window
guardrail: at least 1 trade).

Local grade (kit grade-local, process driver): net PnL +$30.09, 5 fills,
win rate 1.00, max drawdown 0.72%, guardrails met.

- `main.ts` — the bot (Node 22, BigInt math only, stdlib + vendored SDK)
- `vendor/makefun-bars.ts` — byte-identical copy of the kit SDK shim
