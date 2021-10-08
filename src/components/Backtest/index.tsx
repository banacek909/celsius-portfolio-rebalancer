import React, { useContext, ReactElement } from "react";

import { Tab, Tabs, FocusStyleManager } from "@blueprintjs/core";

import Table from "@mui/material/Table";
//import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

//import Coins from "../Coins";

import { Button, MenuItem, InputGroup } from "@blueprintjs/core";
import { Select, ItemRenderer } from "@blueprintjs/select";
import {
  DateInput,
  //  DateFormatProps,
  DatePickerShortcut /*, TimePrecision*/,
} from "@blueprintjs/datetime";

import { Label } from "@blueprintjs/core";

import { Container, Row, Col } from "react-grid-system";

import moment from "moment";
import numeral from "numeral";

import BacktestChart from "../BacktestChart";

import useWindowDimensions from "../../hooks/useWindowDimensions";

import { globalContext } from "../../store";

import { fetchBacktestPrices } from "../../data";

import BacktestLegend from "../BacktestLegend";

import { Logos } from "../../data/logos";

import {
  //backtest,
  //BackTestResults,
  getPortfolioTotals,
  BacktestCoinResult,
  BacktestPortfolioResults,
  //BacktestStats,
  BacktestPortfolioStats,
} from "../../utils";

const Backtest = (): ReactElement => {
  const { width /*, height*/ } = useWindowDimensions();

  const { globalState, dispatch } = useContext(globalContext);

  const prices = {};

  const {
    total_value,
    total_percent_allocated,
    //total_percent_unallocated,
    allocated_amounts_targets,
  } = getPortfolioTotals(prices, globalState.backtest.portfolio, true);

  if (
    !(
      total_value &&
      total_value > 0 &&
      total_percent_allocated === 100 &&
      allocated_amounts_targets &&
      globalState.backtest.portfolio.length >= 2
    )
  ) {
    return <></>;
  }

  FocusStyleManager.onlyShowFocusOnTabs();

  const font_size = 12;

  const tableCellStyle = { fontSize: `${font_size}px` };
  const tableHighestCellStyle = {
    fontSize: `${font_size}px`,
    background: "#f4f4ff",
  };
  let loading = false;

  const { dca, rebalance, results, from, to, portfolio } = globalState.backtest;

  let data: (BacktestCoinResult | BacktestPortfolioResults)[] = [];

  let selectedChartTabIdx = 0;

  if (
    results?.from === from &&
    results?.to === to &&
    JSON.stringify(results.dca) === JSON.stringify(dca) &&
    JSON.stringify(results.rebalance) === JSON.stringify(rebalance) &&
    JSON.stringify(results.backtested_portfolio) ===
      JSON.stringify(portfolio) &&
    results.portfolio.length
  ) {
    if (globalState.backtest.chart.display === "portfolio") {
      data = results.portfolio;
    } else {
      if (globalState.backtest.results.coin) {
        const coins = Object.keys(globalState.backtest.results.coin);
        const idx = coins.indexOf(globalState.backtest.chart.display);

        selectedChartTabIdx = idx === -1 ? 0 : idx + 1;
      }
      if (selectedChartTabIdx === 0) {
        data = results.portfolio;
      } else {
        data = results.coin[globalState.backtest.chart.display];
      }
    }
    loading = false;
  } else {
    fetchBacktestPrices(
      globalState.backtest.portfolio,
      globalState.backtest.from,
      globalState.backtest.to,
      globalState.backtest.rebalance,
      globalState.backtest.dca
    ).then((results) => {
      dispatch({ type: "SET_BACKTEST", payload: results });
    });
    loading = true;
  }

  interface DCAPeriodSelect {
    period: number;
    text: string;
  }

  const SelectDCAPeriod = Select.ofType<DCAPeriodSelect>();

  const periods: DCAPeriodSelect[] = [
    {
      period: 1,
      text: "Day",
    },
    {
      period: 7,
      text: "7 Days",
    },
    {
      period: 14,
      text: "14 Days",
    },
    {
      period: 30,
      text: "30 Days",
    },
  ];

  const renderDCAPeriod: ItemRenderer<DCAPeriodSelect> = (
    dcaPeriod,
    { handleClick, modifiers, query }
  ) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }

    return (
      <MenuItem
        active={modifiers.active}
        disabled={modifiers.disabled}
        key={dcaPeriod.period}
        onClick={handleClick}
        text={dcaPeriod.text}
      />
    );
  };

  const selectDCAPeriodHandler = (period: DCAPeriodSelect) => {
    dispatch({ type: "SET_BACKTEST_DCA_PERIOD", payload: period });
  };

  const handleFromDateChange = (date: Date) => {
    if (moment(date).isValid()) {
      dispatch({ type: "SET_BACKTEST_FROM_DATE", payload: { from: date } });
    }
  };
  const handleToDateChange = (date: Date) => {
    if (moment(date).isValid()) {
      dispatch({ type: "SET_BACKTEST_TO_DATE", payload: { to: date } });
    }
  };

  const setDcaAmountHandler = (e: React.BaseSyntheticEvent) => {
    //const regex = /^[0-9\.]+$/;
    const regex = /^[0-9.]+$/;
    if (
      (e.target.defaultValue === "" && dca.amount > 0) ||
      regex.test(e.target.defaultValue)
    ) {
      const amount =
        e.target.defaultValue === "" ? 0 : parseFloat(e.target.defaultValue);
      dispatch({
        type: "SET_BACKTEST_DCA_AMOUNT",
        payload: { amount: amount },
      });
    }
  };

  const setRebalancePeriodsHandler = (e: React.BaseSyntheticEvent) => {
    const max_periods = 3;
    const arr = e.target.defaultValue
      .split(",")
      .filter((el: any) => el.length && !isNaN(el) && el > 0); // ensure every item is a positive number

    if (arr.length) {
      const periods =
        arr.length > max_periods
          ? arr.slice(0, max_periods).join(",")
          : arr.join(",");
      dispatch({
        type: "SET_BACKTEST_REBALANCE_PERIODS",
        payload: { periods: periods },
      });
    }
  };

  const setRebalanceThresholdsHandler = (e: React.BaseSyntheticEvent) => {
    const max_thresholds = 3;
    const arr = e.target.defaultValue
      .split(",")
      .filter((el: any) => el.length && !isNaN(el) && el > 0); // ensure every item is a positive number

    if (arr.length) {
      const thresholds =
        arr.length > max_thresholds
          ? arr.slice(0, max_thresholds).join(",")
          : arr.join(",");
      dispatch({
        type: "SET_BACKTEST_REBALANCE_THRESHOLDS",
        payload: { thresholds: thresholds },
      });
    }
  };

  const date_shortcuts: DatePickerShortcut[] = [
    {
      label: "3 months ago",
      date: moment().add(-3, "months").toDate(),
    },
    {
      label: "6 months ago",
      date: moment().add(-6, "months").toDate(),
    },
    {
      label: "1 year ago",
      date: moment().add(-1, "years").toDate(),
    },
    {
      label: "2 years ago",
      date: moment().add(-2, "years").toDate(),
    },
    {
      label: "3 years ago",
      date: moment().add(-3, "years").toDate(),
    },
    {
      label: "4 years ago",
      date: moment().add(-4, "years").toDate(),
    },
    {
      label: "5 years ago",
      date: moment().add(-5, "years").toDate(),
    },
  ];

  const handleTabChange = (idx: number) => {
    if (globalState.backtest.results.coin) {
      const coins = Object.keys(globalState.backtest.results.coin);
      if (idx === 0 || idx - 1 <= coins.length - 1) {
        const display = idx === 0 ? "portfolio" : coins[idx - 1];
        dispatch({ type: "SET_BACKTEST_CHART", payload: { display: display } });
      }
    }
  };

  const getStatsResults = () => {
    let stats = null;
    if (!globalState.backtest.results.portfolio.length) {
      return null;
    }
    if (
      results.stats?.portfolio &&
      globalState.backtest.chart.display === "portfolio"
    ) {
      stats = results.stats.portfolio;
      return getPortfolioStatsResults(stats);
    } else {
      if (globalState.backtest.results.coin) {
        const coins = Object.keys(globalState.backtest.results.coin);
        const idx = coins.indexOf(globalState.backtest.chart.display);

        selectedChartTabIdx = idx === -1 ? 0 : idx + 1;
      }
      if (results.stats?.portfolio && selectedChartTabIdx === 0) {
        stats = results.stats.portfolio;
        return getPortfolioStatsResults(stats);
      } else if (results.stats?.coin) {
        stats = results.stats.coin[globalState.backtest.chart.display];
        return getCoinStatsResults(globalState.backtest.chart.display, stats);
      }
    }
    return null;
  };

  const getPortfolioStatsResults = (stats: BacktestPortfolioStats) => {
    let results_rows = [];

    let size = results.portfolio.length;
    let final = results.portfolio[size - 1].buy_and_hold;

    if (globalState.backtest.chart.legend.portfolio.buy_and_hold) {
      results_rows.push({
        ...stats?.buy_and_hold,
        label: "Buy & Hold",
        final_value: final.value,
        final_profit_pc: final.profit_pc,
      });
    }

    if (globalState.backtest.results.dca.amount > 0) {
      let final = results.portfolio[size - 1].dca;
      results_rows.push({
        ...stats?.dca,
        label: `DCA $${globalState.backtest.dca.amount} every ${globalState.backtest.dca.period} days`,
        final_value: final.value,
        final_profit_pc: final.profit_pc,
      });
    }

    const rebalance_periods = globalState.backtest.results.rebalance.periods; //[1, 7, 14];
    const rebalance_thresholds =
      globalState.backtest.results.rebalance.thresholds; //[1, 5, 10];

    const num_rebalance_periods = rebalance_periods.length;
    const num_rebalance_thresholds = rebalance_thresholds.length;

    for (let i = 0; i < num_rebalance_periods; i++) {
      let rp = rebalance_periods[i];

      if (globalState.backtest.chart.legend.portfolio.rebalance.period[i]) {
        let final = results.portfolio[size - 1].rebalanced_period[rp];
        results_rows.push({
          ...stats?.rebalanced_period[rp],
          label: `Rebalance Period ${rp} day`,
          final_value: final.coin_value,
          final_profit_pc: final.profit_pc,
        });
      }

      if (globalState.backtest.results.dca.amount > 0) {
        if (
          globalState.backtest.chart.legend.portfolio.rebalance.period_dca[i]
        ) {
          let final = results.portfolio[size - 1].rebalanced_period_dca[rp];
          results_rows.push({
            ...stats?.rebalanced_period_dca[rp],
            label: `DCA & Rebalance Period ${rp} day`,
            final_value: final.coin_value,
            final_profit_pc: final.profit_pc,
          });
        }
      }
    }

    for (let i = 0; i < num_rebalance_thresholds; i++) {
      let rt = rebalance_thresholds[i];

      if (globalState.backtest.chart.legend.portfolio.rebalance.threshold[i]) {
        let final = results.portfolio[size - 1].rebalanced_threshold[rt];
        results_rows.push({
          ...stats?.rebalanced_threshold[rt],
          label: `Rebalance Threshold ${rt} %`,
          final_value: final.coin_value,
          final_profit_pc: final.profit_pc,
        });
      }

      if (globalState.backtest.results.dca.amount > 0) {
        if (
          globalState.backtest.chart.legend.portfolio.rebalance.threshold_dca[i]
        ) {
          let final = results.portfolio[size - 1].rebalanced_threshold_dca[rt];
          results_rows.push({
            ...stats?.rebalanced_threshold_dca[rt],
            label: `DCA & Rebalance Threshold ${rt} %`,
            final_value: final.coin_value,
            final_profit_pc: final.profit_pc,
          });
        }
      }
    }

    return results_rows.sort((a, b) => {
      return b.final_value - a.final_value;
    });
  };

  const getCoinStatsResults = (coin: string, stats: BacktestPortfolioStats) => {
    let results_rows = [];

    let size = results.coin[coin].length;
    let final = results.coin[coin][size - 1].buy_and_hold;

    if (globalState.backtest.chart.legend.coin.buy_and_hold) {
      results_rows.push({
        ...stats?.buy_and_hold,
        label: "Buy & Hold",
        final_value: final.value,
        final_profit_pc: final.profit_pc,
      });
    }

    if (globalState.backtest.results.dca.amount > 0) {
      let final = results.coin[coin][size - 1].dca;
      results_rows.push({
        ...stats?.dca,
        label: `DCA $${globalState.backtest.dca.amount} every ${globalState.backtest.dca.period} days`,
        final_value: final.value,
        final_profit_pc: final.profit_pc,
      });
    }

    const rebalance_periods = globalState.backtest.results.rebalance.periods; //[1, 7, 14];
    const rebalance_thresholds =
      globalState.backtest.results.rebalance.thresholds; //[1, 5, 10];

    const num_rebalance_periods = rebalance_periods.length;
    const num_rebalance_thresholds = rebalance_thresholds.length;

    for (let i = 0; i < num_rebalance_periods; i++) {
      let rp = rebalance_periods[i];

      if (globalState.backtest.chart.legend.coin.rebalance.period[i]) {
        let final = results.coin[coin][size - 1].rebalanced_period[rp];
        results_rows.push({
          ...stats?.rebalanced_period[rp],
          label: `Rebalance Period ${rp} day`,
          final_value: final.coin_value,
          final_profit_pc: final.profit_pc,
        });
      }

      if (globalState.backtest.results.dca.amount > 0) {
        if (globalState.backtest.chart.legend.coin.rebalance.period_dca[i]) {
          let final = results.coin[coin][size - 1].rebalanced_period_dca[rp];
          results_rows.push({
            ...stats?.rebalanced_period_dca[rp],
            label: `DCA & Rebalance Period ${rp} day`,
            final_value: final.coin_value,
            final_profit_pc: final.profit_pc,
          });
        }
      }
    }

    for (let i = 0; i < num_rebalance_thresholds; i++) {
      let rt = rebalance_thresholds[i];

      if (globalState.backtest.chart.legend.coin.rebalance.threshold[i]) {
        let final = results.coin[coin][size - 1].rebalanced_threshold[rt];
        results_rows.push({
          ...stats?.rebalanced_threshold[rt],
          label: `Rebalance Threshold ${rt} %`,
          final_value: final.coin_value,
          final_profit_pc: final.profit_pc,
        });
      }

      if (globalState.backtest.results.dca.amount > 0) {
        if (globalState.backtest.chart.legend.coin.rebalance.threshold_dca[i]) {
          let final = results.coin[coin][size - 1].rebalanced_threshold_dca[rt];
          results_rows.push({
            ...stats?.rebalanced_threshold_dca[rt],
            label: `DCA & Rebalance Threshold ${rt} %`,
            final_value: final.coin_value,
            final_profit_pc: final.profit_pc,
          });
        }
      }
    }

    return results_rows.sort((a, b) => {
      return b.final_value - a.final_value;
    });
  };

  const renderSettings = () => {
    const font_size = 12;
    const tableCellStyle = { fontSize: `${font_size}px` };

    const idx = periods.findIndex(
      (p) => p.period === globalState.backtest.dca.period
    );
    const dca_period_index = idx === -1 ? 0 : idx;

    return (
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell style={{ ...tableCellStyle, width: "80px" }}>
                <b>From</b>
              </TableCell>
              <TableCell style={{ ...tableCellStyle, width: "80px" }}>
                <b>To</b>
              </TableCell>
              <TableCell
                style={{ ...tableCellStyle, width: "50px" }}
                align="right"
              >
                <b>Rebalance Periods</b>
              </TableCell>
              <TableCell
                style={{ ...tableCellStyle, width: "60px" }}
                align="right"
              >
                <b>Rebalance Thresholds</b>
              </TableCell>
              <TableCell
                style={{ ...tableCellStyle, width: "60px" }}
                align="right"
              >
                <b>Dollar Cost Average (DCA) $</b>
              </TableCell>
              <TableCell
                style={{ ...tableCellStyle, width: "40px" }}
                align="right"
              ></TableCell>
              <TableCell
                style={{ ...tableCellStyle, width: "60px" }}
                align="right"
              >
                <b>DCA Period</b>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={tableCellStyle}>
                <DateInput
                  defaultValue={new Date()}
                  formatDate={(date) =>
                    date == null ? "" : moment(date).format("MMM DD YYYY")
                  }
                  onChange={handleFromDateChange}
                  maxDate={moment().add(-3, "months").toDate()}
                  shortcuts={date_shortcuts}
                  parseDate={(str) => new Date(str)}
                  popoverProps={{ minimal: true }}
                  inputProps={{ asyncControl: true, style: { width: "100px" } }}
                  value={new Date(from)}
                />
              </TableCell>
              <TableCell style={tableCellStyle}>
                <DateInput
                  defaultValue={new Date()}
                  formatDate={(date) =>
                    date == null ? "" : moment(date).format("MMM DD YYYY")
                  }
                  onChange={handleToDateChange}
                  shortcuts={date_shortcuts}
                  parseDate={(str) => new Date(str)}
                  popoverProps={{ minimal: true }}
                  inputProps={{ asyncControl: true, style: { width: "100px" } }}
                  value={new Date(to)}
                />
              </TableCell>
              <TableCell style={tableCellStyle} align="right">
                <InputGroup
                  //type="number"
                  asyncControl={true}
                  placeholder="period (days)"
                  name={"rebalanace_periods"}
                  style={{
                    width: "80px",
                    marginTop: "2px",
                    marginRight: "10px",
                  }}
                  value={globalState.backtest.rebalance.periods.join(",")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setRebalancePeriodsHandler(e);
                    }
                  }}
                  onBlur={(e) => setRebalancePeriodsHandler(e)}
                />
              </TableCell>
              <TableCell style={tableCellStyle} align="right">
                <InputGroup
                  //type="number"
                  asyncControl={true}
                  placeholder="threshold %"
                  name={"rebalanace_thresholds"}
                  style={{
                    width: "80px",
                    marginTop: "2px",
                    marginRight: "10px",
                  }}
                  value={globalState.backtest.rebalance.thresholds.join(",")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setRebalanceThresholdsHandler(e);
                    }
                  }}
                  onBlur={(e) => setRebalanceThresholdsHandler(e)}
                />
              </TableCell>
              <TableCell
                style={{ ...tableCellStyle, width: "200px" }}
                align="right"
              >
                <InputGroup
                  type="number"
                  asyncControl={true}
                  placeholder="$ amount"
                  name={"dca_amount"}
                  style={{ width: "100px", marginTop: "2px" }}
                  value={dca.amount.toString()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setDcaAmountHandler(e);
                    }
                  }}
                  onBlur={(e) => setDcaAmountHandler(e)}
                />
              </TableCell>
              <TableCell style={tableCellStyle} align="right">
                <Label
                  className={"bp3-inline"}
                  style={{
                    marginTop: "15px",
                    marginLeft: "10px",
                    marginRight: "10px",
                  }}
                >
                  every
                </Label>
              </TableCell>
              <TableCell style={tableCellStyle} align="right">
                <SelectDCAPeriod
                  items={periods}
                  itemRenderer={renderDCAPeriod}
                  noResults={<MenuItem disabled={true} text="No results." />}
                  onItemSelect={selectDCAPeriodHandler}
                  popoverProps={{ minimal: true }}
                  activeItem={periods[dca_period_index]}
                  filterable={false}
                >
                  <Button
                    text={periods[dca_period_index].text}
                    rightIcon="caret-down"
                  />
                </SelectDCAPeriod>
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
    );
  };

  const statsResults = getStatsResults();

  return (
    <Container fluid style={{ padding: "0px 40px 40px 40px" }}>
      <Row>
        <Col xs={12} style={{ marginTop: "0px" }}>
          {renderSettings()}
        </Col>
      </Row>
      <Col xs={12}>
        <Row
          style={{
            marginLeft: "0px",
            marginRight: "0px",
            marginTop: "10px",
            marginBottom: "20px",
            borderBottom: "1px solid #aaaaaa",
          }}
        >
          <Tabs selectedTabId={selectedChartTabIdx} onChange={handleTabChange}>
            <Tab id={0} title="Portfolio" />
            {Object.keys(globalState.backtest.results.coin).map((coin, i) => {
              let logo = Logos[coin];
              const logo_text = (
                <div>
                  <img
                    src={logo}
                    width={16}
                    height={16}
                    style={{ marginRight: 5, position: "relative", top: 3 }}
                    alt={coin}
                  />
                  {coin}
                </div>
              );
              return <Tab id={i + 1} title={logo_text} />;
            })}
          </Tabs>
        </Row>
      </Col>

      {loading ? (
        <>{"Loading..."}</>
      ) : data?.length ? (
        <>
          <BacktestLegend />
          <BacktestChart
            data={data ?? []}
            height={600}
            width={width - 95}
            margin={{
              top: 20,
              right: 70,
              bottom: 50,
              left: 70,
            }}
          />

          <TableContainer component={Paper}>
            <Table
              sx={{ minWidth: 650 }}
              size="small"
              aria-label="a dense table"
            >
              <TableHead>
                <TableRow>
                  <TableCell style={tableCellStyle}></TableCell>
                  <TableCell style={tableCellStyle}>
                    <b>Lowest Date</b>
                  </TableCell>
                  <TableCell style={tableCellStyle} align="right">
                    <b>Lowest Value</b>
                  </TableCell>
                  <TableCell style={tableCellStyle} align="right">
                    <b>Lowest Profit %</b>
                  </TableCell>
                  <TableCell style={tableHighestCellStyle}>
                    <b>Highest Date</b>
                  </TableCell>
                  <TableCell style={tableHighestCellStyle} align="right">
                    <b>Highest Value</b>
                  </TableCell>
                  <TableCell style={tableHighestCellStyle} align="right">
                    <b>Highest Profit %</b>
                  </TableCell>
                  <TableCell style={tableCellStyle} align="right">
                    <b>Final Value</b>
                  </TableCell>
                  <TableCell style={tableCellStyle} align="right">
                    <b>Final Profit %</b>
                  </TableCell>
                </TableRow>
                {statsResults &&
                  statsResults.map((row, i) => {
                    return (
                      <TableRow>
                        <TableCell style={tableCellStyle}>
                          <b>{row.label}</b>
                        </TableCell>
                        <TableCell style={tableCellStyle}>
                          {moment(row.min?.date).format("MMM DD YYYY")}
                        </TableCell>
                        <TableCell style={tableCellStyle} align="right">
                          {numeral(row.min?.value).format("$0,0.00")}
                        </TableCell>
                        <TableCell style={tableCellStyle} align="right">
                          {numeral(row.min?.profit_pc).format("0,0.00") + "%"}
                        </TableCell>
                        <TableCell style={tableHighestCellStyle}>
                          {moment(row.max?.date).format("MMM DD YYYY")}
                        </TableCell>
                        <TableCell style={tableHighestCellStyle} align="right">
                          {numeral(row.max?.value).format("$0,0.00")}
                        </TableCell>
                        <TableCell style={tableHighestCellStyle} align="right">
                          {numeral(row.max?.profit_pc).format("0,0.00") + "%"}
                        </TableCell>
                        <TableCell style={tableCellStyle} align="right">
                          {numeral(row.final_value).format("$0,0.00")}
                        </TableCell>
                        <TableCell style={tableCellStyle} align="right">
                          {numeral(row.final_profit_pc).format("0,0.00") + "%"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableHead>
            </Table>
          </TableContainer>
        </>
      ) : null}
    </Container>
  );
};

export default Backtest;
