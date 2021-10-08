export type CoinPrice = [number, number];

export type RiskAnalysisChartData = {
  date: Date;
  price: number;
  profit_pc: number;
};

export interface RiskAnalysisChartProps {
  coin: string;
  data: RiskAnalysisChartData[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}

export type TooltipData = RiskAnalysisChartData;
