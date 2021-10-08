import { useState, useEffect } from "react";

import Coins from "../Coins";
import BacktestCoins from "../BacktestCoins";
import { RebalanceResults } from "../RebalanceResults";
import { coinSymbolMap } from "../../data";

import { fetchCoinPrices } from "../../data";

const non_stable_coins: string[] = [];
Object.keys(coinSymbolMap).forEach((symbol) => {
  if (!coinSymbolMap[symbol].stable_coin) {
    non_stable_coins.push(coinSymbolMap[symbol].id);
  }
});

const coin_ids_csv: string = non_stable_coins.join(",");

export default function Rebalance({ type }: { type: string }) {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    fetchCoinPrices(coin_ids_csv)
      .then((p) => {
        setPrices(p);
      })
      .catch((err) => {
        console.warn(`Error fetching coin prices: ${err}`);
      });

    const interval = setInterval(() => {
      fetchCoinPrices(coin_ids_csv);
    }, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ paddingBottom: "40px" }}>
      {Object.keys(prices).length === 0 ? null : type === "backtest" ? (
        <BacktestCoins {...prices} />
      ) : (
        <Coins {...prices} />
      )}
      {type === "rebalance" ? <RebalanceResults {...prices} /> : null}
    </div>
  );
}
