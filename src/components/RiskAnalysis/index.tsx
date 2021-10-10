import { useContext } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { fetchHistoricCoinPrices } from "../../data";
import { getRiskAnalysisData, RiskAnalysis } from "../../utils";

import RiskAnalysisChart from "../RiskAnalysisChart";
import useWindowDimensions from "../../hooks/useWindowDimensions";

import { DateInput, DatePickerShortcut } from "@blueprintjs/datetime";

import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/datetime/lib/css/blueprint-datetime.css";

import { Button, MenuItem } from "@blueprintjs/core";
import { Select, ItemRenderer } from "@blueprintjs/select";

import { Container, Row, Col } from "react-grid-system";

import { makeStyles } from "@mui/styles";

import moment from "moment";

import numeral from "numeral";

import { globalContext } from "../../store";

import { getProfitPercentage } from "../../utils";

import {
  CoinSelect,
  SelectCoin,
  filterCoin,
  renderCoin,
  itemLogoText,
} from "../SelectCoin";

import {
  CoinPrice,
  RiskAnalysisChartData,
} from "../RiskAnalysisChart/interfaces";

import { coinSymbolMap } from "../../data";

interface PeriodSelectType {
  type: "monthly" | "weekly";
  text: string;
}

const PeriodSelect = Select.ofType<PeriodSelectType>();

let rows: RiskAnalysis[] | undefined = [];
let prices: [number, number][] | undefined = [];

const useStyles = makeStyles((theme: object) => ({
  root: {
    fontSize: "1200px",
  },
  table: {
    fontSize: "10px",
  },
}));

export default function DenseTable() {
  const { globalState, dispatch } = useContext(globalContext);

  const { width /*height*/ } = useWindowDimensions();

  const nonStableCoins: CoinSelect[] = [];
  Object.keys(coinSymbolMap).forEach((key) => {
    if (!coinSymbolMap[key].stable_coin) {
      nonStableCoins.push({
        coin: key,
        id: coinSymbolMap[key].id,
        name: coinSymbolMap[key].name,
      });
    }
  });

  const getChartData = (prices: CoinPrice[]): RiskAnalysisChartData[] => {
    if (prices.length) {
      const initialPrice = prices[0][1];
      return prices.map((p) => {
        return {
          date: new Date(p[0]),
          price: p[1],
          profit_pc: getProfitPercentage(initialPrice, p[1]),
        };
      });
    }
    return [];
  };

  let chartData: RiskAnalysisChartData[] = [];

  let loading = true;
  const { coin, period, from, to, results } = globalState.riskAnalysis;

  if (
    results[coin]?.from === from &&
    results[coin]?.to === to &&
    results[coin]?.prices.length &&
    results[coin][period]
  ) {
    rows = results[coin][period];
    prices = results[coin].prices;
    chartData = getChartData(prices);
    loading = false;
  } else {
    fetchHistoricCoinPrices(coin, from, to)
      .then((coinPrices: [number, number][] | undefined) => {
        prices = coinPrices;
        if (prices) {
          chartData = getChartData(prices);
        }
        const results = {
          monthly: getRiskAnalysisData(prices, "monthly"),
          weekly: getRiskAnalysisData(prices, "weekly"),
        };
        rows = results[period];
        if (rows) {
          dispatch({
            type: "SET_RISK_ANALYSIS_RESULTS",
            payload: {
              coin: coin,
              from: from,
              to: to,
              prices: prices,
              results: results,
            },
          });
        }
        loading = false;
      })
      .catch((err) =>
        console.warn(
          `Failed to fetch historic coin prices for coin ${coin} from ${from} to ${to}: ${err}`
        )
      );
  }

  const average_so_far_bg_colour = "#fdfdbf";

  const font_size = 12;

  const tableCellStyle = { fontSize: `${font_size}px` };
  const tableCellAverageSoFarStyle = {
    fontSize: `${font_size}px`,
    background: average_so_far_bg_colour,
  };

  // accessor
  const getHeatmapColour = (d: RiskAnalysis) => {
    if (d.positive_month > 0) {
      return {
        background: green_colours[d.heatmap],
        fontSize: `${font_size}px`,
      };
    } else {
      return { background: red_colours[d.heatmap], fontSize: `${font_size}px` };
    }
  };

  //const red_colours = ["#f6bdc0", "#f1959b", "#f07470", "#ea4c46", "#dc1c13"];
  //const green_colours = ["#94c58c", "#64ad62", "#429b46", "#1a8828", "#0a6921"];
  const red_colours = ["#ffd0d0", "#ffb4b3", "#ff9896", "#ff7a78", "#ff5959"];
  const green_colours = ["#d5ffd0", "#bcffb6", "#a1ff9c", "#82ff81", "#59ff64"];

  const handleFromDateChange = (date: Date) => {
    if (moment(date).isValid()) {
      dispatch({
        type: "SET_RISK_ANALYSIS_FROM_DATE",
        payload: {
          from: date,
        },
      });
    }
  };
  const handleToDateChange = (date: Date) => {
    if (moment(date).isValid()) {
      dispatch({
        type: "SET_RISK_ANALYSIS_TO_DATE",
        payload: {
          to: date,
        },
      });
    }
  };

  const classes = useStyles();

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

  const handleCoinSelect = (coin: CoinSelect) => {
    dispatch({
      type: "SET_RISK_ANALYSIS_COIN",
      payload: {
        coin: coin.coin,
      },
    });
  };

  const periods: PeriodSelectType[] = [
    {
      type: "monthly",
      text: "Month over Month Performance",
    },
    {
      type: "weekly",
      text: "Week over Week Performance",
    },
  ];

  const renderPeriod: ItemRenderer<PeriodSelectType> = (
    period,
    { handleClick, modifiers, query }
  ) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }

    return (
      <MenuItem
        active={modifiers.active}
        disabled={modifiers.disabled}
        key={period.type}
        onClick={handleClick}
        text={period.text}
      />
    );
  };

  const handlePeriodSelect = (period: PeriodSelectType) => {
    dispatch({
      type: "SET_RISK_ANALYSIS_PERIOD",
      payload: {
        period: period.type,
      },
    });
  };

  const renderSettings = () => {
    const font_size = 12;
    const tableCellStyle = { fontSize: `${font_size}px` };

    const idx = nonStableCoins.findIndex((c) => c.coin === coin);
    const coin_index = idx === -1 ? 0 : idx;

    const idx2 = periods.findIndex((p) => p.type === period);
    const period_index = idx2 === -1 ? 0 : idx2;

    return (
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell style={{ ...tableCellStyle, width: "80px" }}>
                <b>Coin</b>
              </TableCell>
              <TableCell style={{ ...tableCellStyle, width: "80px" }}>
                <b>From</b>
              </TableCell>
              <TableCell style={{ ...tableCellStyle, width: "50px" }}>
                <b>To</b>
              </TableCell>
              <TableCell
                style={{ ...tableCellStyle, width: "60px" }}
                align="right"
              ></TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={tableCellStyle}>
                <SelectCoin
                  items={nonStableCoins}
                  itemPredicate={filterCoin}
                  itemRenderer={renderCoin}
                  noResults={<MenuItem disabled={true} text="No results." />}
                  onItemSelect={handleCoinSelect}
                  popoverProps={{ minimal: true }}
                  activeItem={nonStableCoins[coin_index]}
                >
                  <Button
                    text={itemLogoText(nonStableCoins[coin_index], false, "")}
                    rightIcon="caret-down"
                  />
                </SelectCoin>
              </TableCell>
              <TableCell style={tableCellStyle}>
                <DateInput
                  defaultValue={new Date()}
                  formatDate={(date) =>
                    date == null ? "" : moment(date).format("MMM DD YYYY")
                  }
                  maxDate={moment().add(-3, "months").toDate()}
                  onChange={handleFromDateChange}
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
                  inputProps={{
                    asyncControl: true,
                    style: {
                      width: "100px",
                    },
                  }}
                  value={new Date(to)}
                />
              </TableCell>
              <TableCell style={tableCellStyle} align="right">
                <PeriodSelect
                  items={periods}
                  itemRenderer={renderPeriod}
                  noResults={<MenuItem disabled={true} text="No results." />}
                  onItemSelect={handlePeriodSelect}
                  popoverProps={{ minimal: true }}
                  activeItem={periods[period_index]}
                  filterable={false}
                >
                  <Button
                    text={periods[period_index].text}
                    rightIcon="caret-down"
                  />
                </PeriodSelect>
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container fluid style={{ padding: "0px 40px 40px 40px" }}>
      <Row style={{ marginBottom: "20px" }}>
        <Col
          xs={12}
          style={{
            fontSize: "16px",
            marginRight: "20px",
            marginBottom: "0px",
          }}
        >
          <div>{"Risk Analysis"}</div>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>{renderSettings()}</Col>
      </Row>
      <Row>
        <Col xs={12}>
          <>
            {loading ? (
              <>{"Loading..."}</>
            ) : prices?.length ? (
              <>
                <RiskAnalysisChart
                  coin={coin}
                  data={chartData ?? []}
                  height={600}
                  width={width - 95}
                  margin={{
                    top: 20,
                    right: 70,
                    bottom: 50,
                    left: 70,
                  }}
                />
              </>
            ) : null}
          </>
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <TableContainer component={Paper}>
            <Table
              sx={{ minWidth: 650 }}
              size="small"
              aria-label="a dense table"
              className={classes.table}
            >
              <TableHead>
                <TableRow>
                  <TableCell style={tableCellStyle}>
                    <b>Date</b>
                  </TableCell>
                  <TableCell style={tableCellStyle} align="right">
                    <b>Open</b>
                  </TableCell>
                  <TableCell style={tableCellStyle} align="right">
                    <b>
                      {period === "monthly"
                        ? "Month over Month Performance"
                        : "Week over Week Performance"}
                    </b>
                  </TableCell>
                  <TableCell style={tableCellStyle} align="right">
                    <b>
                      {period === "monthly"
                        ? "Positive Months"
                        : "Positive Weeks"}
                    </b>
                  </TableCell>
                  <TableCell style={tableCellStyle} align="right">
                    <b>
                      {period === "monthly"
                        ? "Negative Months"
                        : "Negative Weeks"}
                    </b>
                  </TableCell>
                  <TableCell style={tableCellStyle} align="right">
                    <b>
                      {period === "monthly"
                        ? "Winning Month Performance"
                        : "Winning Week Performance"}
                    </b>
                  </TableCell>
                  <TableCell style={tableCellStyle} align="right">
                    <b>
                      {period === "monthly"
                        ? "Losing Month Performance"
                        : "Losing Week Performance"}
                    </b>
                  </TableCell>
                  <TableCell style={tableCellStyle} align="right">
                    <b>Kelly Criterion</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows?.map((row: RiskAnalysis, i) => (
                  <TableRow
                    key={row.date}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell
                      component="th"
                      scope="row"
                      style={
                        i === 0 ? tableCellAverageSoFarStyle : tableCellStyle
                      }
                    >
                      {row.date}
                    </TableCell>
                    <TableCell
                      align="right"
                      style={
                        i === 0 ? tableCellAverageSoFarStyle : tableCellStyle
                      }
                    >
                      {i === 0 ? null : numeral(row.open).format("$0,0.00")}
                    </TableCell>
                    <TableCell
                      align="right"
                      style={
                        i === 0
                          ? tableCellAverageSoFarStyle
                          : i === 1
                          ? tableCellStyle
                          : getHeatmapColour(row)
                      }
                    >
                      {i === 1
                        ? null
                        : numeral(row.month_to_month_performance).format(
                            "0,0.00"
                          ) + "%"}
                    </TableCell>
                    <TableCell
                      align="right"
                      style={
                        i === 0 ? tableCellAverageSoFarStyle : tableCellStyle
                      }
                    >
                      {i === 0
                        ? numeral(row.positive_month).format("0,0.00%")
                        : i === 1
                        ? null
                        : row.positive_month}
                    </TableCell>
                    <TableCell
                      align="right"
                      style={
                        i === 0 ? tableCellAverageSoFarStyle : tableCellStyle
                      }
                    >
                      {i === 0
                        ? numeral(row.negative_month).format("0,0.00%")
                        : i === 1
                        ? null
                        : row.negative_month}
                    </TableCell>
                    <TableCell
                      align="right"
                      style={
                        i === 0 ? tableCellAverageSoFarStyle : tableCellStyle
                      }
                    >
                      {i === 1
                        ? null
                        : numeral(row.winning_month_performance).format(
                            "0,0.00"
                          ) + "%"}
                    </TableCell>
                    <TableCell
                      align="right"
                      style={
                        i === 0 ? tableCellAverageSoFarStyle : tableCellStyle
                      }
                    >
                      {i === 1
                        ? null
                        : numeral(row.losing_month_performance).format(
                            "0,0.00"
                          ) + "%"}
                    </TableCell>
                    <TableCell
                      align="right"
                      style={
                        i === 0 ? tableCellAverageSoFarStyle : tableCellStyle
                      }
                    >
                      {i === 0 && row.kc !== -Infinity
                        ? numeral(row.kc).format("0,0.00") + "%"
                        : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Col>
      </Row>
    </Container>
  );
}
