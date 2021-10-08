import React, { useMemo, useCallback, useContext } from "react";
import { format } from "date-fns";
import numeral from "numeral";
import {
  useTooltip,
  TooltipWithBounds,
  defaultStyles as defaultToopTipStyles,
} from "@visx/tooltip";
import { scaleLinear, scaleTime } from "@visx/scale";
import { localPoint } from "@visx/event";
import { Line, Bar } from "@visx/shape";

import { max, min, extent, bisector } from "d3-array";
import { BacktestChartProps } from "./interfaces";
import BacktestLineChart from "../BacktestLineChart";

import { globalContext } from "../../store";

import { BacktestCoinResult, BacktestPortfolioResults } from "../../utils";

import { legendColours } from "../BacktestLegend";

// accessors
const getDate = (d: BacktestCoinResult | BacktestPortfolioResults) =>
  new Date(d.date);

const bisectDate = bisector<
  BacktestCoinResult | BacktestPortfolioResults,
  Date
>((d) => new Date(d.date)).left;

const BacktestChart: React.FC<BacktestChartProps> = ({
  data,
  width = 10,
  height,
  margin = { top: 0, right: 0, bottom: 0, left: 0 },
}) => {
  const { globalState /*, dispatch*/ } = useContext(globalContext);

  const { chart, dca } = globalState.backtest;

  const chart_type = chart.display === "portfolio" ? "portfolio" : "coin";

  const {
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipTop = 0,
    tooltipLeft = 0,
    //tooltipCursorY = 0,
  } = useTooltip<BacktestCoinResult | BacktestPortfolioResults>();

  const rebalance_periods = data.length
    ? Object.keys(data[0].rebalanced_period)
    : [];
  const rebalance_thresholds = data.length
    ? Object.keys(data[0].rebalanced_threshold)
    : [];

  // accessors
  const getRebalancePeriod = (index: number): number =>
    parseInt(rebalance_periods[index]);
  const getRebalanceThreshold = (index: number): number =>
    parseInt(rebalance_thresholds[index]);

  const getBuyAndHoldValue = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.buy_and_hold.value || 0;

  const getDcaValue = (d: BacktestCoinResult | BacktestPortfolioResults) =>
    d.dca.value || 0;

  const getRebalancedPeriod1Value = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_period[getRebalancePeriod(0)].total_value || 0;
  const getRebalancedPeriod2Value = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_period[getRebalancePeriod(1)].total_value || 0;
  const getRebalancedPeriod3Value = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_period[getRebalancePeriod(2)].total_value || 0;

  const getRebalancedThreshold1Value = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_threshold[getRebalanceThreshold(0)].total_value || 0;
  const getRebalancedThreshold2Value = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_threshold[getRebalanceThreshold(1)].total_value || 0;
  const getRebalancedThreshold3Value = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_threshold[getRebalanceThreshold(2)].total_value || 0;

  const getRebalancedPeriodDca1Value = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_period_dca[getRebalancePeriod(0)].total_value || 0;
  const getRebalancedPeriodDca2Value = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_period_dca[getRebalancePeriod(1)].total_value || 0;
  const getRebalancedPeriodDca3Value = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_period_dca[getRebalancePeriod(2)].total_value || 0;

  const getRebalancedThresholdDca1Value = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_threshold_dca[getRebalanceThreshold(0)].total_value || 0;
  const getRebalancedThresholdDca2Value = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_threshold_dca[getRebalanceThreshold(1)].total_value || 0;
  const getRebalancedThresholdDca3Value = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_threshold_dca[getRebalanceThreshold(2)].total_value || 0;

  const getBuyAndHoldProfit = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.buy_and_hold.profit_pc || 0;

  const getDcaProfit = (d: BacktestCoinResult | BacktestPortfolioResults) =>
    d.dca.profit_pc || 0;

  const getRebalancedPeriod1Profit = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_period[getRebalancePeriod(0)].profit_pc || 0;
  const getRebalancedPeriod2Profit = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_period[getRebalancePeriod(1)].profit_pc || 0;
  const getRebalancedPeriod3Profit = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_period[getRebalancePeriod(2)].profit_pc || 0;

  const getRebalancedThreshold1Profit = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_threshold[getRebalanceThreshold(0)].profit_pc || 0;
  const getRebalancedThreshold2Profit = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_threshold[getRebalanceThreshold(1)].profit_pc || 0;
  const getRebalancedThreshold3Profit = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_threshold[getRebalanceThreshold(2)].profit_pc || 0;

  const getRebalancedPeriodDca1Profit = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_period_dca[getRebalancePeriod(0)].profit_pc || 0;
  const getRebalancedPeriodDca2Profit = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_period_dca[getRebalancePeriod(1)].profit_pc || 0;
  const getRebalancedPeriodDca3Profit = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_period_dca[getRebalancePeriod(2)].profit_pc || 0;

  const getRebalancedThresholdDca1Profit = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_threshold_dca[getRebalanceThreshold(0)].profit_pc || 0;
  const getRebalancedThresholdDca2Profit = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_threshold_dca[getRebalanceThreshold(1)].profit_pc || 0;
  const getRebalancedThresholdDca3Profit = (
    d: BacktestCoinResult | BacktestPortfolioResults
  ) => d.rebalanced_threshold_dca[getRebalanceThreshold(2)].profit_pc || 0;

  // bounds
  const xMax = Math.max(width - margin.left - margin.right, 0);
  const yMax = Math.max(height - margin.top - margin.bottom, 0);

  // scales
  const dateScale = scaleTime({
    range: [0, xMax],
    domain: extent(data, getDate) as [Date, Date],
  });

  type Accessor = (d: BacktestCoinResult | BacktestPortfolioResults) => number;

  const yDomain = useMemo(() => {
    let yDomainMin = Infinity;
    let yDomainMax = -Infinity;
    const yDomainAccessors: Accessor[] = [];

    if (chart.legend[chart_type].buy_and_hold) {
      yDomainAccessors.push(getBuyAndHoldValue);
    }

    if (globalState.backtest.dca.amount > 0 && chart.legend[chart_type].dca) {
      yDomainAccessors.push(getDcaValue);
    }
    if (
      rebalance_periods.length >= 1 &&
      chart.legend[chart_type].rebalance.period[0]
    ) {
      yDomainAccessors.push(getRebalancedPeriod1Value);
    }
    if (
      rebalance_periods.length >= 2 &&
      chart.legend[chart_type].rebalance.period[1]
    ) {
      yDomainAccessors.push(getRebalancedPeriod2Value);
    }
    if (
      rebalance_periods.length >= 3 &&
      chart.legend[chart_type].rebalance.period[2]
    ) {
      yDomainAccessors.push(getRebalancedPeriod3Value);
    }
    if (
      rebalance_thresholds.length >= 1 &&
      chart.legend[chart_type].rebalance.threshold[0]
    ) {
      yDomainAccessors.push(getRebalancedThreshold1Value);
    }
    if (
      rebalance_thresholds.length >= 2 &&
      chart.legend[chart_type].rebalance.threshold[1]
    ) {
      yDomainAccessors.push(getRebalancedThreshold2Value);
    }
    if (
      rebalance_thresholds.length >= 3 &&
      chart.legend[chart_type].rebalance.threshold[2]
    ) {
      yDomainAccessors.push(getRebalancedThreshold3Value);
    }

    if (globalState.backtest.dca.amount > 0) {
      if (
        rebalance_periods.length >= 1 &&
        chart.legend[chart_type].rebalance.period_dca[0]
      ) {
        yDomainAccessors.push(getRebalancedPeriodDca1Value);
      }
      if (
        rebalance_periods.length >= 2 &&
        chart.legend[chart_type].rebalance.period_dca[1]
      ) {
        yDomainAccessors.push(getRebalancedPeriodDca2Value);
      }
      if (
        rebalance_periods.length >= 3 &&
        chart.legend[chart_type].rebalance.period_dca[2]
      ) {
        yDomainAccessors.push(getRebalancedPeriodDca3Value);
      }
      if (
        rebalance_thresholds.length >= 1 &&
        chart.legend[chart_type].rebalance.threshold_dca[0]
      ) {
        yDomainAccessors.push(getRebalancedThresholdDca1Value);
      }
      if (
        rebalance_thresholds.length >= 2 &&
        chart.legend[chart_type].rebalance.threshold_dca[1]
      ) {
        yDomainAccessors.push(getRebalancedThresholdDca2Value);
      }
      if (
        rebalance_thresholds.length >= 3 &&
        chart.legend[chart_type].rebalance.threshold_dca[2]
      ) {
        yDomainAccessors.push(getRebalancedThresholdDca3Value);
      }
    }

    yDomainAccessors.forEach((a: Accessor) => {
      const yd_min = min(data, a) || 0;
      if (yd_min < yDomainMin) {
        yDomainMin = yd_min;
      }
      const yd_max = max(data, a) || 0;
      if (yd_max > yDomainMax) {
        yDomainMax = yd_max;
      }
    });

    return [yDomainMin, yDomainMax];
  }, [
    data,
    getRebalancedPeriod1Value,
    getRebalancedPeriod2Value,
    getRebalancedPeriod3Value,
    getRebalancedThreshold1Value,
    getRebalancedThreshold2Value,
    getRebalancedThreshold3Value,
    getRebalancedPeriodDca1Value,
    getRebalancedPeriodDca2Value,
    getRebalancedPeriodDca3Value,
    getRebalancedThresholdDca1Value,
    getRebalancedThresholdDca2Value,
    getRebalancedThresholdDca3Value,
    rebalance_periods,
    rebalance_thresholds,
    chart_type,
    chart.legend,
    globalState.backtest.dca.amount,
  ]);

  const yDomain2 = useMemo(() => {
    let yDomain2Min = Infinity;
    let yDomain2Max = -Infinity;

    const yDomain2Accessors: Accessor[] = [];

    if (chart.legend[chart_type].buy_and_hold) {
      yDomain2Accessors.push(getBuyAndHoldProfit);
    }
    if (globalState.backtest.dca.amount > 0 && chart.legend[chart_type].dca) {
      yDomain2Accessors.push(getDcaProfit);
    }

    if (
      rebalance_periods.length >= 1 &&
      chart.legend[chart_type].rebalance.period[0]
    ) {
      yDomain2Accessors.push(getRebalancedPeriod1Profit);
    }
    if (
      rebalance_periods.length >= 2 &&
      chart.legend[chart_type].rebalance.period[1]
    ) {
      yDomain2Accessors.push(getRebalancedPeriod2Profit);
    }
    if (
      rebalance_periods.length >= 3 &&
      chart.legend[chart_type].rebalance.period[2]
    ) {
      yDomain2Accessors.push(getRebalancedPeriod3Profit);
    }
    if (
      rebalance_thresholds.length >= 1 &&
      chart.legend[chart_type].rebalance.threshold[0]
    ) {
      yDomain2Accessors.push(getRebalancedThreshold1Profit);
    }
    if (
      rebalance_thresholds.length >= 2 &&
      chart.legend[chart_type].rebalance.threshold[1]
    ) {
      yDomain2Accessors.push(getRebalancedThreshold2Profit);
    }
    if (
      rebalance_thresholds.length >= 3 &&
      chart.legend[chart_type].rebalance.threshold[2]
    ) {
      yDomain2Accessors.push(getRebalancedThreshold3Profit);
    }

    if (
      rebalance_periods.length >= 1 &&
      chart.legend[chart_type].rebalance.period_dca[0]
    ) {
      yDomain2Accessors.push(getRebalancedPeriodDca1Profit);
    }
    if (
      rebalance_periods.length >= 2 &&
      chart.legend[chart_type].rebalance.period_dca[1]
    ) {
      yDomain2Accessors.push(getRebalancedPeriodDca2Profit);
    }
    if (
      rebalance_periods.length >= 3 &&
      chart.legend[chart_type].rebalance.period_dca[2]
    ) {
      yDomain2Accessors.push(getRebalancedPeriodDca3Profit);
    }
    if (
      rebalance_thresholds.length >= 1 &&
      chart.legend[chart_type].rebalance.threshold_dca[0]
    ) {
      yDomain2Accessors.push(getRebalancedThresholdDca1Profit);
    }
    if (
      rebalance_thresholds.length >= 2 &&
      chart.legend[chart_type].rebalance.threshold_dca[1]
    ) {
      yDomain2Accessors.push(getRebalancedThresholdDca2Profit);
    }
    if (
      rebalance_thresholds.length >= 3 &&
      chart.legend[chart_type].rebalance.threshold_dca[2]
    ) {
      yDomain2Accessors.push(getRebalancedThresholdDca3Profit);
    }

    yDomain2Accessors.forEach((a: Accessor) => {
      const yd_min = min(data, a) || 0;
      if (yd_min < yDomain2Min) {
        yDomain2Min = yd_min;
      }
      const yd_max = max(data, a) || 0;
      if (yd_max > yDomain2Max) {
        yDomain2Max = yd_max;
      }
    });

    return [yDomain2Min, yDomain2Max];
  }, [
    data,
    getRebalancedPeriod1Profit,
    getRebalancedPeriod2Profit,
    getRebalancedPeriod3Profit,
    getRebalancedThreshold1Profit,
    getRebalancedThreshold2Profit,
    getRebalancedThreshold3Profit,
    getRebalancedPeriodDca1Profit,
    getRebalancedPeriodDca2Profit,
    getRebalancedPeriodDca3Profit,
    getRebalancedThresholdDca1Profit,
    getRebalancedThresholdDca2Profit,
    getRebalancedThresholdDca3Profit,
    rebalance_periods,
    rebalance_thresholds,
    chart_type,
    chart.legend,
    globalState.backtest.dca.amount,
  ]);

  const priceScale = useMemo(() => {
    return scaleLinear({
      range: [yMax + margin.top, margin.top],
      domain: yDomain,
      nice: true,
    });
    //
  }, [margin.top, yMax, yDomain]);

  const profitScale = useMemo(() => {
    return scaleLinear({
      range: [yMax + margin.top, margin.top],
      domain: yDomain2,
      nice: true,
    });
    //
  }, [margin.top, yMax, yDomain2]);

  const handleTooltip = useCallback(
    (
      event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>
    ) => {
      const { x, y } = localPoint(event) || { x: 0, y: 0 };
      const currX = x - margin.left;
      const x0 = dateScale.invert(currX);
      const index = bisectDate(data, x0, 1);
      const d0 = data[index - 1];
      const d1 = data[index];
      let d = d0;

      // calculate the cursor position and convert where to position the tooltip box.
      if (d1 && getDate(d1)) {
        d =
          x0.valueOf() - getDate(d0).valueOf() >
          getDate(d1).valueOf() - x0.valueOf()
            ? d1
            : d0;
      }

      showTooltip({
        tooltipData: d,
        tooltipLeft: x,
        //tooltipTop: y,
        tooltipTop: priceScale(getBuyAndHoldValue(d)),
      });
    },
    [showTooltip, dateScale, data, margin.left, priceScale]
  );

  const getTooltipData = (
    tooltipData: BacktestCoinResult | BacktestPortfolioResults
  ): {
    label: string;
    legend: string;
    price: number;
    profit_pc: number;
  }[] => {
    let rows = [];

    if (chart.legend[chart_type].buy_and_hold) {
      rows.push({
        label: "Buy & Hold",
        legend: legendColours.buy_and_hold,
        price: getBuyAndHoldValue(tooltipData),
        profit_pc: getBuyAndHoldProfit(tooltipData),
      });
    }

    if (globalState.backtest.dca.amount > 0 && chart.legend[chart_type].dca) {
      rows.push({
        label: `DCA $${dca.amount} every ${dca.period} days`,
        legend: legendColours.dca,
        price: getDcaValue(tooltipData),
        profit_pc: getDcaProfit(tooltipData),
      });
    }
    if (
      rebalance_periods.length >= 1 &&
      chart.legend[chart_type].rebalance.period[0]
    ) {
      rows.push({
        label: `Rebalance Period ${rebalance_periods[0]} days`,
        legend: legendColours.period[0],
        price: getRebalancedPeriod1Value(tooltipData),
        profit_pc: getRebalancedPeriod1Profit(tooltipData),
      });
    }
    if (
      rebalance_periods.length >= 2 &&
      chart.legend[chart_type].rebalance.period[1]
    ) {
      rows.push({
        label: `Rebalance Period ${rebalance_periods[1]} days`,
        legend: legendColours.period[1],
        price: getRebalancedPeriod2Value(tooltipData),
        profit_pc: getRebalancedPeriod2Profit(tooltipData),
      });
    }
    if (
      rebalance_periods.length >= 3 &&
      chart.legend[chart_type].rebalance.period[2]
    ) {
      rows.push({
        label: `Rebalance Period ${rebalance_periods[2]} days`,
        legend: legendColours.period[2],
        price: getRebalancedPeriod3Value(tooltipData),
        profit_pc: getRebalancedPeriod3Profit(tooltipData),
      });
    }
    if (
      rebalance_thresholds.length >= 1 &&
      chart.legend[chart_type].rebalance.threshold[0]
    ) {
      rows.push({
        label: `Rebalance Threshold ${rebalance_thresholds[0]} %`,
        legend: legendColours.threshold[0],

        price: getRebalancedThreshold1Value(tooltipData),
        profit_pc: getRebalancedThreshold1Profit(tooltipData),
      });
    }
    if (
      rebalance_thresholds.length >= 2 &&
      chart.legend[chart_type].rebalance.threshold[1]
    ) {
      rows.push({
        label: `Rebalance Threshold ${rebalance_thresholds[1]} %`,
        legend: legendColours.threshold[1],
        price: getRebalancedThreshold2Value(tooltipData),
        profit_pc: getRebalancedThreshold2Profit(tooltipData),
      });
    }
    if (
      rebalance_thresholds.length >= 3 &&
      chart.legend[chart_type].rebalance.threshold[2]
    ) {
      rows.push({
        label: `Rebalance Threshold ${rebalance_thresholds[2]} %`,
        legend: legendColours.threshold[2],
        price: getRebalancedThreshold3Value(tooltipData),
        profit_pc: getRebalancedThreshold3Profit(tooltipData),
      });
    }

    if (globalState.backtest.dca.amount > 0) {
      if (
        rebalance_periods.length >= 1 &&
        chart.legend[chart_type].rebalance.period_dca[0]
      ) {
        rows.push({
          label: `DCA & Rebalance Period ${rebalance_periods[0]} days`,
          legend: legendColours.period_dca[0],

          price: getRebalancedPeriodDca1Value(tooltipData),
          profit_pc: getRebalancedPeriodDca1Profit(tooltipData),
        });
      }
      if (
        rebalance_periods.length >= 2 &&
        chart.legend[chart_type].rebalance.period_dca[1]
      ) {
        rows.push({
          label: `DCA & Rebalance Period ${rebalance_periods[1]} days`,
          legend: legendColours.period_dca[1],
          price: getRebalancedPeriodDca2Value(tooltipData),
          profit_pc: getRebalancedPeriodDca2Profit(tooltipData),
        });
      }
      if (
        rebalance_periods.length >= 3 &&
        chart.legend[chart_type].rebalance.period_dca[2]
      ) {
        rows.push({
          label: `DCA & Rebalance Period ${rebalance_periods[2]} days`,
          legend: legendColours.period_dca[2],

          price: getRebalancedPeriodDca3Value(tooltipData),
          profit_pc: getRebalancedPeriodDca3Profit(tooltipData),
        });
      }
      if (
        rebalance_thresholds.length >= 1 &&
        chart.legend[chart_type].rebalance.threshold_dca[0]
      ) {
        rows.push({
          label: `DCA & Rebalance Threshold ${rebalance_thresholds[0]} %`,
          legend: legendColours.threshold_dca[0],

          price: getRebalancedThresholdDca1Value(tooltipData),
          profit_pc: getRebalancedThresholdDca1Profit(tooltipData),
        });
      }
      if (
        rebalance_thresholds.length >= 2 &&
        chart.legend[chart_type].rebalance.threshold_dca[1]
      ) {
        rows.push({
          label: `DCA & Rebalance Threshold ${rebalance_thresholds[1]} %`,
          legend: legendColours.threshold_dca[1],
          price: getRebalancedThresholdDca2Value(tooltipData),
          profit_pc: getRebalancedThresholdDca2Profit(tooltipData),
        });
      }
      if (
        rebalance_thresholds.length >= 3 &&
        chart.legend[chart_type].rebalance.threshold_dca[2]
      ) {
        rows.push({
          label: `DCA & Rebalance Threshold ${rebalance_thresholds[2]} %`,
          legend: legendColours.threshold_dca[2],

          price: getRebalancedThresholdDca3Value(tooltipData),
          profit_pc: getRebalancedThresholdDca3Profit(tooltipData),
        });
      }
    }

    return rows.sort((a, b) => b.profit_pc - a.profit_pc);
  };

  return (
    <div style={{ position: "relative", margin: "0 0 1rem" }}>
      <svg width={width} height={height}>
        <BacktestLineChart
          data={data}
          width={width}
          height={height}
          margin={{ ...margin }}
          xMax={xMax}
          yMax={yMax}
          xScale={dateScale}
          yScale={priceScale}
          yScale2={profitScale}
          stroke={"#000000"}
          xTickFormat={(d: number) => {
            return numeral(d).format(d <= 100 ? "$0.00" : "$0,0");
          }}
        />
        {/* a transparent ele that track the pointer event, allow us to display tooltup */}
        <Bar
          x={margin.left}
          y={margin.top * 2}
          width={xMax}
          height={yMax}
          fill="transparent"
          rx={14}
          onTouchStart={handleTooltip}
          onTouchMove={handleTooltip}
          onMouseMove={handleTooltip}
          onMouseLeave={() => hideTooltip()}
        />
        {tooltipData && (
          <g>
            <Line
              from={{ x: tooltipLeft, y: margin.top * 2 }}
              to={{ x: tooltipLeft, y: yMax + margin.top * 2 }}
              stroke={"#000000"}
              strokeWidth={1}
              opacity={0.5}
              pointerEvents="none"
              strokeDasharray="5,2"
            />
          </g>
        )}
      </svg>
      {tooltipData && (
        <div>
          <TooltipWithBounds
            key={Math.random()}
            top={tooltipTop}
            left={tooltipLeft}
            style={{
              ...defaultToopTipStyles,
              fontFamily: "Roboto, sans-serif",
              fontSize: "12px",
              background: "#ffffff",
              padding: "0.5rem",
              border: "1px solid black",
              color: "black",
            }}
          >
            <ul style={{ padding: "0", margin: "0", listStyle: "none" }}>
              <li style={{ paddingBottom: "0px" }}>
                {format(getDate(tooltipData), "PPpp")}
              </li>
              {getTooltipData(tooltipData).map((d, i) => {
                return (
                  <li key={i} style={{ marginTop: "10px" }}>
                    <div style={{ marginTop: "10x", marginBottom: "3px" }}>
                      {
                        <svg width={15} height={13}>
                          <rect
                            fill={d.legend}
                            width={15}
                            height={15 / 2.5}
                            y={5}
                          />
                        </svg>
                      }
                      <b style={{ marginLeft: "8px" }}>{d.label}</b>
                    </div>
                    Balance: <b>{numeral(d.price).format("$0,0.00")}</b>
                    {"   "}, Profit:{" "}
                    <b>{numeral(d.profit_pc).format("0,0.00") + "%"}</b>
                  </li>
                );
              })}
            </ul>
          </TooltipWithBounds>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          top: margin.top / 2 - 10,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          fontSize: "12px",
        }}
      ></div>
    </div>
  );
};
export default BacktestChart;
