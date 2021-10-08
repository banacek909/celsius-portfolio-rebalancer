import { Prices } from "../components/Rebalance/types";

import coinSymbolMapJSON from "./coins.json";

import { backtest, BackTestResults } from "../utils";

import { setup } from "axios-cache-adapter";
import {
  BacktestDcaType,
  BacktestRebalanceType,
  PortfolioCoin,
} from "../store/types";

import moment from "moment";

export const api = setup({
  baseURL: "https://api.coingecko.com",
  cache: {
    maxAge: 1000 * 60 * 60, // 60 minutes
    exclude: { query: false },
    readHeaders: false,
    debug: true,
  },
});

interface CoinGeckoCoin {
  id: string;
  name: string;
  symbol: string;
  stable_coin: number;
}

type CoinSymbolMap = { [symbol: string]: CoinGeckoCoin };
export const coinSymbolMap: CoinSymbolMap = coinSymbolMapJSON;

type CoinGeckoMap = { [id: string]: string };
export const coinGeckoMap: CoinGeckoMap = {};

for (const [symbol, obj] of Object.entries(coinSymbolMap)) {
  coinGeckoMap[obj.id] = symbol;
}

export const fetchCoinPrices = async (coin_ids_csv: string) => {
  const prices: Prices = {};
  type CoinGeckoResponse = { [id: string]: { usd: number } };
  const response = await api
    .get<CoinGeckoResponse>(
      `/api/v3/simple/price?ids=${coin_ids_csv}&vs_currencies=usd`,
      {
        cache: {
          maxAge: 1000 * 60 * 1, // 1 min instead of 60 min
        },
      }
    )
    .catch((err) => console.warn(`Failed to fetch prices: ${err}`));

  if (response?.data) {
    Object.keys(response.data).forEach((id) => {
      prices[coinGeckoMap[id]] = response.data[id].usd;
    });
  }
  return prices;
};

export const fetchHistoricCoinPrices = async (
  coin: string,
  from: Date,
  to: Date
) => {
  type CoinGeckoMarketChartResponse = {
    prices: [number, number][];
    market_caps: [number, number][];
    total_volumes: [number, number][];
  };

  const id = coinSymbolMap[coin].id;

  const from_unix = moment(from).unix();
  const to_unix = moment(to).unix();

  const response = await api
    .get<CoinGeckoMarketChartResponse>(
      `/api/v3/coins/${id}/market_chart/range?vs_currency=usd&from=${from_unix}&to=${to_unix}`
    )
    .catch((err) =>
      console.warn(
        `Failed to fetch backtest coin prices for coin ${coin} from ${from} to ${to}: ${err}`
      )
    );
  return response?.data.prices;
};

type BackTestCoinStartDates = { [coin: string]: string };
type BackTestCoinPrice = { [coin: string]: number };
type BackTestCoinPrices = { [date: string]: BackTestCoinPrice };
export type BackTestData = {
  start_dates: BackTestCoinStartDates;
  prices: BackTestCoinPrices;
};

const parallelFetchBacktestCoinPrices = (
  coins: string[],
  from: Date,
  to: Date
) => {
  const fetchPromises = coins.map((coin) =>
    fetchHistoricCoinPrices(coin, from, to)
  );
  return Promise.all(fetchPromises);
};

export const fetchBacktestPrices = (
  //coins: string[],
  portfolio_coins: PortfolioCoin[],
  from: Date,
  to: Date,
  rebalance: BacktestRebalanceType,
  dca: BacktestDcaType
) => {
  const backtest_data: BackTestData = {
    start_dates: {},
    prices: {},
  };

  const coins: string[] = portfolio_coins.map((p) => p.coin);

  return parallelFetchBacktestCoinPrices(coins, from, to).then((responses) => {
    if (responses?.length) {
      responses.forEach((data, i) => {
        const response_coin = coins[i];
        if (data?.length) {
          data.forEach((arr, i) => {
            if (arr[0] in backtest_data.prices) {
              backtest_data.prices[arr[0]][response_coin] = arr[1];
            } else {
              backtest_data.prices[arr[0]] = {
                [response_coin]: arr[1],
              };
            }
          });
        }
      });

      // validate prices: for each timestamp ensure each coin has a price
      for (const [timestamp, obj] of Object.entries(backtest_data.prices)) {
        if (Object.keys(obj).length !== coins.length) {
          delete backtest_data.prices[timestamp];
        }
      }

      const sortObject = (obj: BackTestCoinPrices) =>
        Object.keys(obj)
          .sort()
          .reduce(
            (res: BackTestCoinPrices, key: string) => (
              (res[key] = obj[key]), res
            ),
            {}
          );

      const date_sorted_prices = sortObject(backtest_data.prices);
      backtest_data.prices = date_sorted_prices;

      const rebalance_hours = 24 * 7;

      const backtest_results: BackTestResults = backtest(
        from,
        to,
        rebalance,
        dca,
        backtest_data,
        rebalance_hours,
        portfolio_coins
      );
      return backtest_results;
    }
  });
};
