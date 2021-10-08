import React, { useMemo, useCallback } from "react";
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
import { RiskAnalysisChartProps, RiskAnalysisChartData } from "./interfaces";

import RiskAnalysisLineChart from "../RiskAnalysisLineChart";

// accessors
export const getDate = (d: RiskAnalysisChartData) => new Date(d.date);
export const getPrice = (d: RiskAnalysisChartData) => d.price;
export const getProfit = (d: RiskAnalysisChartData) => d.profit_pc;

const getFormatValue = (d: RiskAnalysisChartData) =>
  numeral(d?.price || 0).format("$0,0.00");

const getFormatProfit = (d: RiskAnalysisChartData) =>
  numeral(d?.profit_pc || 0).format("0,0.00");

const bisectDate = bisector<RiskAnalysisChartData, Date>(
  (d) => new Date(d.date)
).left;

const RiskAnalysisChart: React.FC<RiskAnalysisChartProps> = ({
  coin,
  data,
  width = 10,
  height,
  margin = { top: 0, right: 0, bottom: 0, left: 0 },
}) => {
  const {
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipTop = 0,
    tooltipLeft = 0,
  } = useTooltip<RiskAnalysisChartData>();

  // bounds
  const xMax = Math.max(width - margin.left - margin.right, 0);
  const yMax = Math.max(height - margin.top - margin.bottom, 0);

  const dateScale = scaleTime({
    range: [0, xMax],
    domain: extent(data, getDate) as [Date, Date],
  });

  type Accessor = (d: RiskAnalysisChartData) => number;

  const yDomain = useMemo(() => {
    let yDomainMin = Infinity;
    let yDomainMax = -Infinity;

    const yDomainAccessors: Accessor[] = [getPrice];

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
  }, [data]);

  const yDomain2 = useMemo(() => {
    let yDomain2Min = Infinity;
    let yDomain2Max = -Infinity;

    const yDomain2Accessors: Accessor[] = [getProfit];

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
  }, [data]);

  let [y1min, y1max] = yDomain;
  let [y2min, y2max] = yDomain2;
  var y1ratio = y1max / (y1max - y1min);
  var y2ratio = y2max / (y2max - y2min);

  // adjust min/max values for positive negative values zero line etc
  var allSameSign = false;

  // if all numbers are positive set floor to zero
  if (y1min > 0 && y2min > 0 && y2min > 0 && y2max > 0) {
    allSameSign = true;
    y1min = 0;
    y2min = 0;
  }

  // if all numbers are negative set ceiling to zero
  if (y1min < 0 && y2min < 0 && y2min < 0 && y2max < 0) {
    allSameSign = true;
    y1max = 0;
    y2max = 0;
  }

  // align zero line if necessary
  if (!allSameSign && y1ratio !== y2ratio) {
    if (y1ratio < y2ratio) {
      // adjust y2min
      y2min = (y1min / y1max) * y2max;
    } else {
      // adjust y1min
      y1min = (y2min / y2max) * y1max;
    }
  }

  const priceScale = useMemo(() => {
    return scaleLinear({
      range: [yMax + margin.top, margin.top],
      domain: [min(data, getPrice) || 0, max(data, getPrice) || 0],
      nice: true,
    });
    //
  }, [margin.top, yMax, data]);

  const profitScale = useMemo(() => {
    return scaleLinear({
      range: [yMax + margin.top, margin.top],
      domain: [y2min, y2max],
      nice: true,
    });
  }, [margin.top, yMax, y2min, y2max]);

  const handleTooltip = useCallback(
    (
      event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>
    ) => {
      const { x /*y*/ } = localPoint(event) || { x: 0, y: 0 };
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
        tooltipTop: priceScale(getPrice(d)),
      });
    },
    [showTooltip, priceScale, dateScale, data, margin.left]
  );

  return (
    <div style={{ position: "relative", margin: "0 0 1rem" }}>
      <svg width={width} height={height}>
        <RiskAnalysisLineChart
          coin={coin}
          data={data}
          width={width}
          height={height}
          margin={{ ...margin }}
          xMax={xMax}
          yMax={yMax}
          xScale={dateScale}
          yScale={priceScale}
          yScale2={profitScale}
          stroke={"#448afe"}
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
            <circle
              cx={tooltipLeft}
              cy={tooltipTop + margin.top}
              r={4}
              fill="black"
              fillOpacity={0.1}
              stroke={tooltipLeft < 100 ? "transparent" : "black"}
              strokeOpacity={0.1}
              strokeWidth={2}
              pointerEvents="none"
            />
            <circle
              cx={tooltipLeft}
              cy={tooltipTop + margin.top}
              r={4}
              fill={"#888888"}
              stroke="white"
              strokeWidth={2}
              pointerEvents="none"
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
              <li style={{ paddingBottom: "10px" }}>
                {format(getDate(tooltipData), "PPpp")}
              </li>
              <li>
                Price: <b>{`${getFormatValue(tooltipData)}`}</b>
                {"   "}, Profit: <b>{`${getFormatProfit(tooltipData)} %`}</b>
              </li>
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

export default RiskAnalysisChart;
