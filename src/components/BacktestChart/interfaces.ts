import { BacktestCoinResult, BacktestPortfolioResults } from "../../utils";

export interface BacktestChartProps {
  data: (BacktestCoinResult | BacktestPortfolioResults)[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}

export type TooltipData = BacktestCoinResult | BacktestPortfolioResults;
