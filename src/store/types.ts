import { Dispatch } from "react";

import {
  RiskAnalysis,
  BacktestCoinResults,
  BacktestPortfolioResults,
  BacktestStats,
} from "../utils";

export type RiskAnalysisType = {
  from: Date;
  to: Date;
  coin: string;
  period: "monthly" | "weekly";
  results: {
    [coin: string]: {
      from: Date;
      to: Date;
      prices: [number, number][];
      monthly: RiskAnalysis[];
      weekly: RiskAnalysis[];
    };
  };
};

export type BacktestDcaType = {
  amount: number;
  period: number;
};

export type BacktestRebalanceType = {
  periods: number[];
  thresholds: number[];
};

type BacktestChartLegendType = {
  buy_and_hold: 0 | 1;
  dca: 0 | 1;
  rebalance: {
    period: [0 | 1, 0 | 1, 0 | 1];
    threshold: [0 | 1, 0 | 1, 0 | 1];
    period_dca: [0 | 1, 0 | 1, 0 | 1];
    threshold_dca: [0 | 1, 0 | 1, 0 | 1];
  };
};

type BackTestChartType = {
  display: string; //"portfolio";
  legend: {
    portfolio: BacktestChartLegendType;
    coin: BacktestChartLegendType;
  };
};

type BacktestResultsType = {
  from: Date;
  to: Date;
  dca: BacktestDcaType;
  rebalance: BacktestRebalanceType;
  backtested_portfolio: PortfolioCoin[];
  coin: BacktestCoinResults;
  portfolio: BacktestPortfolioResults[];
  stats: BacktestStats;
};

export type BacktestType = {
  from: Date;
  to: Date;
  portfolio: PortfolioCoin[];
  dca: BacktestDcaType;
  rebalance: BacktestRebalanceType;
  results: BacktestResultsType;
  chart: BackTestChartType;
};

export interface GlobalStateInterface {
  portfolio: PortfolioCoin[];
  backtest: BacktestType;
  riskAnalysis: RiskAnalysisType;
  historicalPrices: {
    [coin: string]: {
      from: Date;
      to: Date;
      prices: [number, number][];
    };
  };
  persistenceType: string;
}

export type ActionType = {
  type: string;
  payload?: any;
};

export type ContextType = {
  globalState: GlobalStateInterface;
  dispatch: Dispatch<ActionType>;
};

export interface PortfolioCoin {
  coin: string;
  amount: number;
  value: number;
  rebalance: {
    threshold: number;
    percent: number;
    value: number;
  };
}
