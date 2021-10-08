import React from "react";
import { LinePath } from "@visx/shape";
import { Group } from "@visx/group";
import { AxisLeft, AxisRight, AxisBottom } from "@visx/axis";
import { GridRows, GridColumns } from "@visx/grid";
import { timeFormat } from "d3-time-format";
import { LineChartProps } from "./interfaces";

import { getDate, getPrice, getProfit } from "../RiskAnalysisChart";

import {
  AXIS_COLOR,
  AXIS_BOTTOM_TICK_LABEL_PROPS,
  AXIS_LEFT_TICK_LABEL_PROPS,
  AXIS_RIGHT_TICK_LABEL_PROPS,
} from "./constants";
import { RiskAnalysisChartData } from "../RiskAnalysisChart/interfaces";

const RiskAnalysisLineChart: React.FC<LineChartProps> = ({
  coin,
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
  if (!data) return null;

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

  if (width < 10) return null;

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

      {
        <LinePath<RiskAnalysisChartData>
          data={data}
          x={(d) => xScale(getDate(d)) || 0}
          y={(d) => yScale(getPrice(d)) || 0}
          strokeWidth={1.5}
          strokeOpacity={0.8}
          stroke={stroke}
        />
      }
      {0 && (
        <LinePath<RiskAnalysisChartData>
          data={data}
          x={(d) => xScale(getDate(d)) || 0}
          y={(d) => yScale2(getProfit(d)) || 0}
          strokeWidth={1.5}
          strokeOpacity={0.8}
          stroke={"#aa0000"}
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
          label={`${coin} Price`}
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

export default RiskAnalysisLineChart;
