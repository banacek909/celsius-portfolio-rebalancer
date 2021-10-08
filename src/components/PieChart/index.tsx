import React, { useContext } from "react";
import Pie, { ProvidedProps, PieArcDatum } from "@visx/shape/lib/shapes/Pie";
import { scaleOrdinal } from "@visx/scale";
import { Group } from "@visx/group";
import { animated, useTransition, to } from "react-spring";

import { globalContext } from "../../store";

import { PieChartData } from "../RebalanceResults";

import { Prices } from "../Rebalance/types";
import { getPortfolioTotals, getRebalanceAmounts } from "../../utils";

// accessor
const percentage = (p: PieChartData) => p.percent;

export const portfolioPieColors = [
  "#2965CC",
  "#29A634",
  "#D13913",
  "#8F398F",
  "#00B3A4",
  "#DB2C6F",
  "#9BBF30",
  "#96622D",
  "#7157D9",
  "#D99E0B",

  "rgb(112, 31, 191)",
  "rgb(188, 62, 179)",
  "rgb(244, 65, 171)",
  "rgb(215, 64, 176)",
  "rgb(15, 27, 100)",
  "#027ed1",
  "#4C66F5",
  "#4F99FF",
  "#54B9E8",
  "#ff5f97",
  "#f95d6a",
  "#eb4034",
  "#ff5b39",
  "#ff7c43",
  "#ffa600",
  "#0A2239",
  "#003f5c",
  "#2f4b7c",
  "#665191",
  "#8902d1",
  "#b76fd2",
  "#a05195",
  "#d45087",
  "#11d47c",
  "#56d162",
  "#7ace49",
  "#99c930",
  "#2a262b",
  "#4a3243",
  "#713c54",
  "#9a465a",
  "#c15356",
  "#ffb23e",
  "#ffbf61",
  "#ffcb81",
  "#ffd8a0",
  "#ffe5c0",
  "#ff1f55",
  "#ff0073",
  "#e6194b",
  "#2F243A",
  "#ec4e20",
  "#FFBC42",
  "#D81159",
  "#0496FF",
  "#006BA6",
];

// color scales
const defaultMargin = { top: 20, right: 20, bottom: 20, left: 20 };

export type PieProps = {
  width: number;
  height: number;
  prices: Prices;
  margin?: typeof defaultMargin;
  animate?: boolean;
};

export default function PortfolioPieChart({
  width,
  height,
  prices,
  margin = defaultMargin,
  animate = true,
}: PieProps) {
  const { globalState /* dispatch*/ } = useContext(globalContext);

  const {
    total_value,
    total_percent_allocated,
    //total_percent_unallocated,
    //allocated_amounts_targets,
  } = getPortfolioTotals(prices, globalState.portfolio, false);
  if (
    !(
      total_value &&
      total_value > 0 &&
      total_percent_allocated === 100 &&
      globalState.portfolio.length >= 2 &&
      Object.keys(prices).length
    )
  ) {
    return <></>;
  }

  const pie_chart_current_data: PieChartData[] = globalState.portfolio.map(
    (pcoin) => {
      const {
        current_percentage,
        /*target_percentage,
        difference_percentage,
        threshold_percentage,
        reached_threshold,
        target_value,
        target_amount,
        to_balance_value,
        to_balance_amount,
        to_balance_direction,*/
      } = getRebalanceAmounts(
        pcoin,
        prices[pcoin.coin],
        pcoin.amount,
        total_value
      );
      return {
        coin: pcoin.coin,
        percent: current_percentage,
      };
    }
  );
  const pie_chart_target_data: PieChartData[] = globalState.portfolio.map(
    (pcoin) => {
      const {
        //current_percentage,
        target_percentage,
        /*difference_percentage,
        threshold_percentage,
        reached_threshold,
        target_value,
        target_amount,
        to_balance_value,
        to_balance_amount,
        to_balance_direction,*/
      } = getRebalanceAmounts(
        pcoin,
        prices[pcoin.coin],
        pcoin.amount,
        total_value
      );
      return {
        coin: pcoin.coin,
        percent: target_percentage ? target_percentage : 0,
      };
    }
  );

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const radius = Math.min(innerWidth, innerHeight) / 2;
  const centerY = innerHeight / 2;
  const centerX = innerWidth / 2;
  const donutThickness = radius / 2.75;

  const getPortfolioPieColor = scaleOrdinal({
    domain: pie_chart_target_data.map((d) => d.coin),
    range: portfolioPieColors,
  });

  const outerRadius2 = radius - donutThickness - radius / 100;
  const font_size = radius / 15;

  return (
    <svg width={width} height={height}>
      <Group top={centerY + margin.top} left={centerX + margin.left}>
        <Pie
          data={pie_chart_target_data}
          pieValue={percentage}
          outerRadius={radius}
          innerRadius={radius - donutThickness}
          cornerRadius={3}
          padAngle={0.005}
          pieSort={null}
        >
          {(pie) => (
            <AnimatedPie<PieChartData>
              {...pie}
              animate={animate}
              fontSize={font_size}
              getKey={(arc) => arc.data.coin}
              getValue={(arc) => arc.data.percent.toFixed(0).toString()}
              getColor={(arc) => getPortfolioPieColor(arc.data.coin)}
            />
          )}
        </Pie>
        <Pie
          data={pie_chart_current_data}
          pieValue={percentage}
          outerRadius={outerRadius2}
          innerRadius={outerRadius2 - donutThickness}
          cornerRadius={3}
          padAngle={0.005}
          pieSort={null}
        >
          {(pie) => (
            <AnimatedPie<PieChartData>
              {...pie}
              animate={animate}
              fontSize={font_size}
              getKey={(arc) => arc.data.coin}
              getValue={(arc) => arc.data.percent.toFixed(0).toString()}
              getColor={(arc) => getPortfolioPieColor(arc.data.coin)}
            />
          )}
        </Pie>
      </Group>
    </svg>
  );
}

// react-spring transition definitions
type AnimatedStyles = { startAngle: number; endAngle: number; opacity: number };

const fromLeaveTransition = ({ endAngle }: PieArcDatum<any>) => ({
  // enter from 360° if end angle is > 180°
  startAngle: endAngle > Math.PI ? 2 * Math.PI : 0,
  endAngle: endAngle > Math.PI ? 2 * Math.PI : 0,
  opacity: 0,
});
const enterUpdateTransition = ({ startAngle, endAngle }: PieArcDatum<any>) => ({
  startAngle,
  endAngle,
  opacity: 1,
});

type AnimatedPieProps<Datum> = ProvidedProps<Datum> & {
  animate?: boolean;
  fontSize?: number;
  getKey: (d: PieArcDatum<Datum>) => string;
  getValue: (d: PieArcDatum<Datum>) => string;
  getColor: (d: PieArcDatum<Datum>) => string;
  //onClickDatum: (d: PieArcDatum<Datum>) => void;
  delay?: number;
};

function AnimatedPie<Datum>({
  animate,
  arcs,
  path,
  fontSize = 12,
  getKey,
  getValue,
  getColor,
}: //onClickDatum,
AnimatedPieProps<Datum>) {
  const transitions = useTransition<PieArcDatum<Datum>, AnimatedStyles>(arcs, {
    from: animate ? fromLeaveTransition : enterUpdateTransition,
    enter: enterUpdateTransition,
    update: enterUpdateTransition,
    leave: animate ? fromLeaveTransition : enterUpdateTransition,
    keys: getKey,
  });

  return transitions((props, arc, { key }) => {
    const [centroidX, centroidY] = path.centroid(arc);
    const hasSpaceForLabel = arc.endAngle - arc.startAngle >= 0.4;

    return (
      <g key={key}>
        <animated.path
          // compute interpolated path d attribute from intermediate angle values
          d={to([props.startAngle, props.endAngle], (startAngle, endAngle) =>
            path({
              ...arc,
              startAngle,
              endAngle,
            })
          )}
          fill={getColor(arc)}
        />
        {hasSpaceForLabel && (
          <animated.g style={{ opacity: props.opacity }}>
            <text
              fill="white"
              x={centroidX}
              y={centroidY}
              dy=".33em"
              fontSize={fontSize}
              textAnchor="middle"
              pointerEvents="none"
            >
              <>
                {getKey(arc) + " "}
                {getValue(arc) + "%"}
              </>
            </text>
          </animated.g>
        )}
      </g>
    );
  });
}
