import { useContext } from "react";
import { scaleOrdinal } from "@visx/scale";
import { LegendOrdinal, LegendItem, LegendLabel } from "@visx/legend";

import { globalContext } from "../../store";

export const legendColours = {
  buy_and_hold: "#000000", //"#66d981",
  dca: "#51d5cf",
  period: ["#B3CFFF", "#6F8ACB", "#1F4B99"],
  threshold: ["#e8c1bD", "#FA9EA8", "#DA2C43"],
  period_dca: ["#b3c8b3", "#7AB97A", "#228B22"],
  threshold_dca: ["#D391FA", "#B240FD", "#6B00D7"],
};

/*
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
  "#006BA6",*/

const legendTitles = {
  buy_and_hold: "Buy & Hold",
  dca: "DCA",
  period: "Rebalance Period",
  threshold: "Rebalance Threshold",
  period_dca: "DCA & Rebalance Period",
  threshold_dca: "DCA & Rebalance Threshold",
};

const disabled_colour = "#cccccc";

const legendGlyphSize = 15;

export default function BacktestLegend() {
  const { globalState, dispatch } = useContext(globalContext);

  const { chart, dca, rebalance } = globalState.backtest;

  const chart_type = chart.display === "portfolio" ? "portfolio" : "coin";

  let chart_domain: string[] = [];
  let chart_range: string[] = [];

  let disabled: (0 | 1)[] = []; //[0, 0, 0, 1];

  chart_domain.push("Buy & Hold");
  chart_range.push(legendColours.buy_and_hold);

  if (chart.legend[chart_type].buy_and_hold) {
    disabled.push(0);
  } else {
    disabled.push(1);
  }

  if (dca.amount > 0) {
    chart_domain.push(`DCA $${dca.amount} every ${dca.period} days`);
    chart_range.push(legendColours.dca);
    if (chart.legend[chart_type].dca) {
      disabled.push(0);
    } else {
      disabled.push(1);
    }
  }

  const rebalance_periods_selected =
    chart.legend[chart_type].rebalance.period.indexOf(1);
  chart_domain.push(legendTitles.period);
  chart_range.push("");
  if (rebalance_periods_selected > -1) {
    disabled.push(0);
  } else {
    disabled.push(1);
  }

  rebalance.periods.forEach((period, i) => {
    //debugger;
    chart_domain.push(`${period} day`);
    chart_range.push(legendColours.period[i]);
    if (chart.legend[chart_type].rebalance.period[i]) {
      disabled.push(0);
    } else {
      disabled.push(1);
    }
  });

  const rebalance_thresholds_selected =
    chart.legend[chart_type].rebalance.threshold.indexOf(1);
  chart_domain.push(legendTitles.threshold);
  chart_range.push("");
  if (rebalance_thresholds_selected > -1) {
    disabled.push(0);
  } else {
    disabled.push(1);
  }

  rebalance.thresholds.forEach((threshold, i) => {
    chart_domain.push(`${threshold} %`);
    chart_range.push(legendColours.threshold[i]);
    if (chart.legend[chart_type].rebalance.threshold[i]) {
      disabled.push(0);
    } else {
      disabled.push(1);
    }
  });

  if (dca.amount > 0) {
    const rebalance_periods_dca_selected =
      chart.legend[chart_type].rebalance.period_dca.indexOf(1);
    chart_domain.push(legendTitles.period_dca);
    chart_range.push("");
    if (rebalance_periods_dca_selected > -1) {
      disabled.push(0);
    } else {
      disabled.push(1);
    }

    rebalance.periods.forEach((period, i) => {
      chart_domain.push(`_DCA_${period} day`);
      chart_range.push(legendColours.period_dca[i]);
      if (chart.legend[chart_type].rebalance.period_dca[i]) {
        disabled.push(0);
      } else {
        disabled.push(1);
      }
    });

    const rebalance_thresholds_dca_selected =
      chart.legend[chart_type].rebalance.threshold_dca.indexOf(1);
    chart_domain.push(legendTitles.threshold_dca);
    chart_range.push("");
    if (rebalance_thresholds_dca_selected > -1) {
      disabled.push(0);
    } else {
      disabled.push(1);
    }

    rebalance.thresholds.forEach((threshold, i) => {
      chart_domain.push(`_DCA_${threshold} %`);
      chart_range.push(legendColours.threshold_dca[i]);
      if (chart.legend[chart_type].rebalance.threshold_dca[i]) {
        disabled.push(0);
      } else {
        disabled.push(1);
      }
    });
  }
  const ordinalColorScale = scaleOrdinal({
    domain: chart_domain,
    range: chart_range,
  });

  const legendHandler = (label: {
    datum: string;
    index: number;
    text: string;
    value?: string;
  }) => {
    if (label.text === legendTitles.buy_and_hold) {
      dispatch({
        type: "TOGGLE_BACKTEST_CHART_LEGEND",
        payload: { chart_type: chart_type, line: "buy_and_hold" },
      });
    } else if (label.text.indexOf("DCA $") !== -1) {
      dispatch({
        type: "TOGGLE_BACKTEST_CHART_LEGEND",
        payload: { chart_type: chart_type, line: "dca" },
      });
    } else if (label.text === "Rebalance Period") {
      dispatch({
        type: "TOGGLE_BACKTEST_CHART_LEGEND",
        payload: { chart_type: chart_type, group: "period" },
      });
    } else if (label.text === "Rebalance Threshold") {
      dispatch({
        type: "TOGGLE_BACKTEST_CHART_LEGEND",
        payload: { chart_type: chart_type, group: "threshold" },
      });
    } else if (dca.amount > 0 && label.text === "DCA & Rebalance Period") {
      dispatch({
        type: "TOGGLE_BACKTEST_CHART_LEGEND",
        payload: { chart_type: chart_type, group: "period_dca" },
      });
    } else if (dca.amount > 0 && label.text === "DCA & Rebalance Threshold") {
      dispatch({
        type: "TOGGLE_BACKTEST_CHART_LEGEND",
        payload: { chart_type: chart_type, group: "threshold_dca" },
      });
    } else if (label.text.indexOf("day") !== -1) {
      rebalance.periods.forEach((period, i) => {
        if (label.value === legendColours.period[i]) {
          dispatch({
            type: "TOGGLE_BACKTEST_CHART_LEGEND",
            payload: { chart_type: chart_type, line: "period", number: i },
          });
        }
        if (dca.amount > 0 && label.value === legendColours.period_dca[i]) {
          dispatch({
            type: "TOGGLE_BACKTEST_CHART_LEGEND",
            payload: { chart_type: chart_type, line: "period_dca", number: i },
          });
        }
      });
    }

    if (label.text.indexOf("%") !== -1) {
      rebalance.thresholds.forEach((threshold, i) => {
        if (label.value === legendColours.threshold[i]) {
          dispatch({
            type: "TOGGLE_BACKTEST_CHART_LEGEND",
            payload: { chart_type: chart_type, line: "threshold", number: i },
          });
        }
        if (dca.amount > 0 && label.value === legendColours.threshold_dca[i]) {
          dispatch({
            type: "TOGGLE_BACKTEST_CHART_LEGEND",
            payload: {
              chart_type: chart_type,
              line: "threshold_dca",
              number: i,
            },
          });
        }
      });
    }
  };

  return (
    <div>
      <LegendOrdinal
        scale={ordinalColorScale}
        labelFormat={(label) => `${label}`}
      >
        {(labels) => (
          <div style={{ display: "flex", flexDirection: "row" }}>
            {labels.map((label, i) => (
              <LegendItem
                key={`legend-backtest-${i}`}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  cursor: label.text === "Buy & Hold" ? "default" : "pointer",
                  margin:
                    label.value === ""
                      ? "0px 5px 0px 15px"
                      : label.value &&
                        (label.text.indexOf("day") > -1 ||
                          label.text.indexOf("%") > -1)
                      ? "0px 5px"
                      : "0 15px",
                }}
                onClick={() => {
                  legendHandler(label);
                }}
              >
                {label.value !== "" && (
                  <svg width={legendGlyphSize} height={legendGlyphSize}>
                    <rect
                      fill={disabled[i] ? disabled_colour : label.value}
                      width={legendGlyphSize}
                      height={legendGlyphSize / 2.5}
                      y={5}
                    />
                  </svg>
                )}
                <LegendLabel
                  align="left"
                  style={{
                    fontSize: "12px",
                    marginLeft: "4px",
                    color: disabled[i] ? "#aaaaaa" : "#000000",
                  }}
                >
                  {label.text.replace("_DCA_", "")}
                </LegendLabel>
              </LegendItem>
            ))}
          </div>
        )}
      </LegendOrdinal>
    </div>
  );
}
