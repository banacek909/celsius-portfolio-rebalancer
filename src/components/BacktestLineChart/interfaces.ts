import { AxisScale } from "@visx/axis";

import { BacktestCoinResult, BacktestPortfolioResults } from "../../utils";

export interface LineChartProps {
  data: (BacktestCoinResult | BacktestPortfolioResults)[];
  xScale: AxisScale<number>;
  yScale: AxisScale<number>;
  yScale2: AxisScale<number>;
  width: number;
  height: number;
  xMax: number;
  yMax: number;
  margin: { top: number; right: number; bottom: number; left: number };
  hideBottomAxis?: boolean;
  stroke: string;
  hideLeftAxis?: boolean;
  hideRightAxis?: boolean;
  top?: number;
  left?: number;
  children?: React.ReactNode;
  xTickFormat?: (d: any) => any;
}
