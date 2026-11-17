# btc-race-24h-20261117-0603

[![make.fun · btc-race-24h-20261117-0603](https://make.fun/badge/btc-race-24h-20261117-0603.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![rank](https://make.fun/badge/btc-race-24h-20261117-0603/meongs123/btc-race-24h-20261117-0603/rank.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![reward](https://make.fun/badge/btc-race-24h-20261117-0603/meongs123/btc-race-24h-20261117-0603/reward.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)

Bot for make.fun ["Race a BTC trading bot live for 24 hours"](https://make.fun/bounty/btc-race-24h-20261117-0603)
(btc-race-24h-20261117-0603): trades cbBTC/USDC on 1-minute bars, $1,000 paper.

Strategy: 60-minute dip-bounce. The dev window is a quiet sideways tape
(mean |1m move| 4.3 bps, zero 1-minute drops >= 50 bps), so the bot buys a
slow 60-minute drawdown of 110+ bps and rides the snap-back: take profit
+180 bps, stop loss -80 bps, trailing stop -100 bps from the peak since
entry. Fallback trigger 70 bps after bar 900 if no trade yet (race-window
guardrail: at least 1 trade).

Revision after the first local grade: a 30-bar re-entry cooldown after a
stop-loss exit (no instant re-buy of the same falling knife), and the close
history is now bounded to the last 61 bars. Both are inert on the dev
window (no stop ever fired there); the re-grade below is unchanged.

Local grade (kit grade-local, process driver): net PnL +$30.09, 5 fills,
win rate 1.00, max drawdown 0.72%, guardrails met.

- `main.ts` — the bot (Node 22, BigInt math only, stdlib + vendored SDK)
- `vendor/makefun-bars.ts` — byte-identical copy of the kit SDK shim
