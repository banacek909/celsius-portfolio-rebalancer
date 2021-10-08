import React, { useContext } from "react";
import { LinePath } from "@visx/shape";
import { Group } from "@visx/group";
import { AxisLeft, AxisRight, AxisBottom } from "@visx/axis";
import { GridRows, GridColumns } from "@visx/grid";
import { timeFormat } from "d3-time-format";
import { LineChartProps } from "./interfaces";

import { globalContext } from "../../store";

import { legendColours } from "../BacktestLegend";

import {
  BacktestCoinResult,
  //getRebalancePeriod,
  BacktestPortfolioResults,
} from "../../utils";

import {
  AXIS_COLOR,
  AXIS_BOTTOM_TICK_LABEL_PROPS,
  AXIS_LEFT_TICK_LABEL_PROPS,
  AXIS_RIGHT_TICK_LABEL_PROPS,
} from "./constants";

const LineChart: React.FC<LineChartProps> = ({
  data,
  width,
  height,
  xMax,
  yMax,
  margin,
  xScale,
  yScale,
  yScale2,
  hideBottomAxis = false,
  hideLeftAxis = false,
  hideRightAxis = false,
  stroke,
  top,
  left,
  xTickFormat,
  children,
}) => {
  const { globalState /*, dispatch */ } = useContext(globalContext);

  if (!data) return null;

  const { chart /*dca, rebalance*/ } = globalState.backtest;

  const chart_type = chart.display === "portfolio" ? "portfolio" : "coin";

  if (chart.legend[chart_type].buy_and_hold) {
  }

  const rebalance_periods = data.length
    ? Object.keys(data[0].rebalanced_period)
    : [];
  const rebalance_thresholds = data.length
    ? Object.keys(data[0].rebalanced_threshold)
    : [];

  // accessors
  const getDate = (d: BacktestCoinResult | BacktestPortfolioResults) =>
    new Date(d?.date);

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

  const dateTickFormat = (v: Date, i: number) => {
    if (width > 600) {
      return timeFormat("%b %d %Y")(v);
    } else if (width > 400 || i % 2 === 0) {
      // month format
      if (timeFormat("%m")(v) === "01") {
        return timeFormat("%Y")(v);
      }
      return timeFormat("%b")(v);
    } else {
      return "";
    }
  };

  const background = "#ffffff";

  return (
    <Group left={left || margin.left} top={top || margin.top}>
      <rect
        x={-margin.left}
        y={0}
        width={width}
        height={height}
        fill={background}
        rx={0}
      />

      {chart.legend[chart_type].buy_and_hold && (
        <LinePath<BacktestCoinResult | BacktestPortfolioResults>
          data={data}
          x={(d) => xScale(getDate(d)) || 0}
          y={(d) => yScale(getBuyAndHoldValue(d)) || 0}
          strokeWidth={1.5}
          strokeOpacity={0.8}
          stroke={legendColours.buy_and_hold} // stroke
        />
      )}
      {globalState.backtest.dca.amount > 0 && chart.legend[chart_type].dca && (
        <LinePath<BacktestCoinResult | BacktestPortfolioResults>
          data={data}
          x={(d) => xScale(getDate(d)) || 0}
          y={(d) => yScale(getDcaValue(d)) || 0}
          strokeWidth={1.5}
          strokeOpacity={0.8}
          stroke={legendColours.dca} // stroke
        />
      )}
      {rebalance_periods.length >= 1 &&
        chart.legend[chart_type].rebalance.period[0] && (
          <LinePath<BacktestCoinResult | BacktestPortfolioResults>
            data={data}
            x={(d) => xScale(getDate(d)) || 0}
            y={(d) => yScale(getRebalancedPeriod1Value(d)) || 0}
            strokeWidth={1.5}
            strokeOpacity={0.8}
            stroke={legendColours.period[0]}
          />
        )}
      {rebalance_periods.length >= 2 &&
        chart.legend[chart_type].rebalance.period[1] && (
          <LinePath<BacktestCoinResult | BacktestPortfolioResults>
            data={data}
            x={(d) => xScale(getDate(d)) || 0}
            y={(d) => yScale(getRebalancedPeriod2Value(d)) || 0}
            strokeWidth={1.5}
            strokeOpacity={0.8}
            stroke={legendColours.period[1]}
          />
        )}
      {rebalance_periods.length >= 3 &&
        chart.legend[chart_type].rebalance.period[2] && (
          <LinePath<BacktestCoinResult | BacktestPortfolioResults>
            data={data}
            x={(d) => xScale(getDate(d)) || 0}
            y={(d) => yScale(getRebalancedPeriod3Value(d)) || 0}
            strokeWidth={1.5}
            strokeOpacity={0.8}
            stroke={legendColours.period[2]}
          />
        )}
      {rebalance_thresholds.length >= 1 &&
        chart.legend[chart_type].rebalance.threshold[0] && (
          <LinePath<BacktestCoinResult | BacktestPortfolioResults>
            data={data}
            x={(d) => xScale(getDate(d)) || 0}
            y={(d) => yScale(getRebalancedThreshold1Value(d)) || 0}
            strokeWidth={1.5}
            strokeOpacity={0.8}
            stroke={legendColours.threshold[0]}
          />
        )}
      {rebalance_thresholds.length >= 2 &&
        chart.legend[chart_type].rebalance.threshold[1] && (
          <LinePath<BacktestCoinResult | BacktestPortfolioResults>
            data={data}
            x={(d) => xScale(getDate(d)) || 0}
            y={(d) => yScale(getRebalancedThreshold2Value(d)) || 0}
            strokeWidth={1.5}
            strokeOpacity={0.8}
            stroke={legendColours.threshold[1]}
          />
        )}
      {rebalance_thresholds.length >= 3 &&
        chart.legend[chart_type].rebalance.threshold[2] && (
          <LinePath<BacktestCoinResult | BacktestPortfolioResults>
            data={data}
            x={(d) => xScale(getDate(d)) || 0}
            y={(d) => yScale(getRebalancedThreshold3Value(d)) || 0}
            strokeWidth={1.5}
            strokeOpacity={0.8}
            stroke={legendColours.threshold[2]}
          />
        )}
      {globalState.backtest.dca.amount > 0 &&
        chart.legend[chart_type].rebalance.period_dca[0] && (
          <LinePath<BacktestCoinResult | BacktestPortfolioResults>
            data={data}
            x={(d) => xScale(getDate(d)) || 0}
            y={(d) => yScale(getRebalancedPeriodDca1Value(d)) || 0}
            strokeWidth={1.5}
            strokeOpacity={0.8}
            stroke={legendColours.period_dca[0]} // stroke
          />
        )}
      {globalState.backtest.dca.amount > 0 &&
        chart.legend[chart_type].rebalance.period_dca[1] && (
          <LinePath<BacktestCoinResult | BacktestPortfolioResults>
            data={data}
            x={(d) => xScale(getDate(d)) || 0}
            y={(d) => yScale(getRebalancedPeriodDca2Value(d)) || 0}
            strokeWidth={1.5}
            strokeOpacity={0.8}
            stroke={legendColours.period_dca[1]} // stroke
          />
        )}
      {globalState.backtest.dca.amount > 0 &&
        chart.legend[chart_type].rebalance.period_dca[2] && (
          <LinePath<BacktestCoinResult | BacktestPortfolioResults>
            data={data}
            x={(d) => xScale(getDate(d)) || 0}
            y={(d) => yScale(getRebalancedPeriodDca3Value(d)) || 0}
            strokeWidth={1.5}
            strokeOpacity={0.8}
            stroke={legendColours.period_dca[2]} // stroke
          />
        )}
      {globalState.backtest.dca.amount > 0 &&
        chart.legend[chart_type].rebalance.threshold_dca[0] && (
          <LinePath<BacktestCoinResult | BacktestPortfolioResults>
            data={data}
            x={(d) => xScale(getDate(d)) || 0}
            y={(d) => yScale(getRebalancedThresholdDca1Value(d)) || 0}
            strokeWidth={1.5}
            strokeOpacity={0.8}
            stroke={legendColours.threshold_dca[0]} // stroke
          />
        )}
      {globalState.backtest.dca.amount > 0 &&
        chart.legend[chart_type].rebalance.threshold_dca[1] && (
          <LinePath<BacktestCoinResult | BacktestPortfolioResults>
            data={data}
            x={(d) => xScale(getDate(d)) || 0}
            y={(d) => yScale(getRebalancedThresholdDca2Value(d)) || 0}
            strokeWidth={1.5}
            strokeOpacity={0.8}
            stroke={legendColours.threshold_dca[1]} // stroke
          />
        )}
      {globalState.backtest.dca.amount > 0 &&
        chart.legend[chart_type].rebalance.threshold_dca[2] && (
          <LinePath<BacktestCoinResult | BacktestPortfolioResults>
            data={data}
            x={(d) => xScale(getDate(d)) || 0}
            y={(d) => yScale(getRebalancedThresholdDca3Value(d)) || 0}
            strokeWidth={1.5}
            strokeOpacity={0.8}
            stroke={legendColours.threshold_dca[2]} // stroke
          />
        )}
      <GridRows
        scale={yScale}
        width={xMax}
        stroke="#000000"
        strokeOpacity={0.25}
        strokeDasharray="1,2"
      />
      <GridColumns
        scale={xScale}
        height={height - margin.left}
        top={margin.top}
        stroke="#000000"
        strokeOpacity={0.25}
        strokeDasharray="1,2"
      />

      {!hideBottomAxis && (
        <AxisBottom
          top={yMax + margin.top}
          scale={xScale}
          numTicks={width > 520 ? 10 : 5}
          stroke={AXIS_COLOR}
          tickStroke={AXIS_COLOR}
          tickLabelProps={() => AXIS_BOTTOM_TICK_LABEL_PROPS}
          tickFormat={dateTickFormat}
        />
      )}
      {!hideLeftAxis && (
        <AxisLeft
          scale={yScale}
          numTicks={5}
          label={
            globalState.backtest.chart.display === "portfolio"
              ? "Portfolio Balance"
              : `${globalState.backtest.chart.display} Balance`
          }
          labelProps={{ fontSize: "14px", textAnchor: "middle" }}
          labelOffset={45}
          stroke={AXIS_COLOR}
          tickStroke={AXIS_COLOR}
          tickLabelProps={() => AXIS_LEFT_TICK_LABEL_PROPS}
          tickFormat={(d) => {
            return xTickFormat ? xTickFormat(d) : d;
          }}
        />
      )}
      {!hideRightAxis && (
        <AxisRight
          left={xMax}
          scale={yScale2}
          numTicks={5}
          label={"Performance"}
          labelProps={{ fontSize: "14px", textAnchor: "middle" }}
          labelOffset={45}
          orientation="right"
          stroke={AXIS_COLOR}
          tickStroke={AXIS_COLOR}
          tickLabelProps={() => AXIS_RIGHT_TICK_LABEL_PROPS}
          tickFormat={(d) => {
            return `${d} %`;
          }}
        />
      )}
      {children}
    </Group>
  );
};

export default LineChart;
