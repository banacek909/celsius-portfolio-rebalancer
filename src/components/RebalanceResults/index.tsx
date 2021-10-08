import React, { ReactElement, useContext } from "react";

import useWindowDimensions from "../../hooks/useWindowDimensions";

import { Button, InputGroup, FocusStyleManager } from "@blueprintjs/core";

import Table from "@mui/material/Table";
//import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import { Container, Row, Col } from "react-grid-system";

import numeral from "numeral";

import { Logos } from "../../data/logos";
import { coinSymbolMap } from "../../data";

import { globalContext } from "../../store";

import { Prices } from "../Rebalance/types";

import { getPortfolioTotals, getRebalanceAmounts } from "../../utils";

import PortfolioPieChart from "../PieChart";

export type PieChartData = { coin: string; percent: number };

let pie_chart_current_data: PieChartData[] = [];
let pie_chart_target_data: PieChartData[] = [];

export const RebalanceResults = (prices: Prices): ReactElement => {
  const { width /*height*/ } = useWindowDimensions();

  FocusStyleManager.onlyShowFocusOnTabs();

  const { globalState, dispatch } = useContext(globalContext);

  const {
    total_value,
    total_percent_allocated,
    //total_percent_unallocated,
    allocated_amounts_targets,
  } = getPortfolioTotals(prices, globalState.portfolio, false);
  if (
    !(
      total_value &&
      total_value > 0 &&
      total_percent_allocated === 100 &&
      allocated_amounts_targets &&
      globalState.portfolio.length >= 2 &&
      Object.keys(prices).length
    )
  ) {
    return <></>;
  }

  const setThresholdHandler = (e: React.BaseSyntheticEvent) => {
    const regex = /^[0-9\.]+$/;
    if (regex.test(e.target.defaultValue)) {
      const [coin /*threshold*/] = e.target.name.split("_");
      dispatch({
        type: "SET_COIN_THRESHOLD",
        payload: {
          coin: coin,
          threshold: parseFloat(e.target.defaultValue),
        },
      });
    }
  };

  const TableHeader = () => {
    return (
      <TableHead>
        <TableRow>
          <TableCell style={{ ...tableCellStyle, width: "150px" }}>
            <b>Coin</b>
          </TableCell>
          <TableCell style={{ ...tableCellStyle, width: "80px" }} align="right">
            <b>Amount</b>
          </TableCell>
          <TableCell style={{ ...tableCellStyle, width: "50px" }} align="right">
            <b>Current Value</b>
          </TableCell>
          <TableCell style={{ ...tableCellStyle, width: "60px" }} align="right">
            <b>Current %</b>
          </TableCell>
          <TableCell style={{ ...tableCellStyle, width: "60px" }} align="right">
            <b>Target %</b>
          </TableCell>
          <TableCell style={{ ...tableCellStyle, width: "60px" }} align="right">
            <b>Difference %</b>
          </TableCell>
          <TableCell style={{ ...tableCellStyle, width: "80px" }} align="right">
            <b>Threshold %</b>
          </TableCell>
          <TableCell
            style={{ ...tableCellStyle, width: "150px" }}
            align="right"
          >
            <b>Transfer For Target %</b>
          </TableCell>
        </TableRow>
      </TableHead>
    );
  };

  const transferFundsHandler = (
    e: React.BaseSyntheticEvent,
    coin: string,
    index: number
  ) => {
    globalState.portfolio.forEach((ele, idx) => {
      const {
        //current_percentage,
        //target_percentage,
        //difference_percentage,
        //threshold_percentage,
        //reached_threshold,
        //target_value,
        target_amount,
        //to_balance_value,
        //to_balance_amount,
        //to_balance_direction,
      } = getRebalanceAmounts(ele, prices[ele.coin], ele.amount, total_value);

      dispatch({
        type: "SET_COIN_AMOUNT",
        payload: {
          coin: ele.coin,
          amount: target_amount,
        },
      });
    });
  };

  const TableBody = () => {
    pie_chart_current_data = [];
    pie_chart_target_data = [];

    return (
      <>
        {globalState.portfolio?.length
          ? globalState.portfolio.map((ele, idx) => {
              const style = {
                display: "flex",
                alignItems: "center",
                height: 40,
              };

              const {
                current_percentage,
                target_percentage,
                difference_percentage,
                threshold_percentage,
                reached_threshold,
                //target_value,
                //target_amount,
                to_balance_value,
                to_balance_amount,
                to_balance_direction,
              } = getRebalanceAmounts(
                ele,
                prices[ele.coin],
                ele.amount,
                total_value
              );

              let to_balance_text = "";
              let to_balance_text2 = "";
              if (to_balance_value && to_balance_amount) {
                to_balance_text =
                  to_balance_direction +
                  " " +
                  numeral(Math.abs(to_balance_value)).format("$0,0.00");
                to_balance_text2 =
                  "(" +
                  numeral(Math.abs(to_balance_amount)).format("0,0.0000") +
                  " " +
                  ele.coin +
                  ")";
              }

              const small_image = Logos[ele.coin];

              pie_chart_current_data.push({
                coin: ele.coin,
                percent: current_percentage,
              });

              pie_chart_target_data.push({
                coin: ele.coin,
                percent: target_percentage || 0,
              });

              return (
                <TableRow key={ele.coin}>
                  <TableCell style={tableCellStyle}>
                    <div style={style}>
                      <img
                        height="25"
                        width="25"
                        src={small_image}
                        style={{ marginRight: 5 }}
                        alt={ele.coin}
                      />
                      <div
                        style={{
                          marginTop: "3px",
                        }}
                      >
                        {coinSymbolMap[ele.coin].name}
                      </div>
                      <div
                        style={{
                          color: "#888888",
                          marginLeft: "5px",
                          marginTop: "3px",
                        }}
                      >
                        {ele.coin}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    {ele.amount
                      .toFixed(8)
                      .toString()
                      .replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, "$1")}
                  </TableCell>
                  <TableCell align={"right"}>
                    {ele.amount > 0 && prices[ele.coin]
                      ? numeral(prices[ele.coin] * ele.amount).format("$0,0.00")
                      : null}
                  </TableCell>
                  <TableCell align={"right"}>
                    {total_value
                      ? numeral(current_percentage).format("0.0") + "%"
                      : null}
                  </TableCell>
                  <TableCell align={"right"}>
                    {numeral(target_percentage).format("0.0") + "%"}
                  </TableCell>
                  <TableCell align={"right"}>
                    {numeral(difference_percentage).format("0,0.0") + "%"}
                  </TableCell>
                  <TableCell align={"right"}>
                    <InputGroup
                      type="number"
                      asyncControl={true}
                      name={`${ele.coin}_threshold`}
                      className={`${ele.coin}_threshold`}
                      style={{ width: "70px" }}
                      value={threshold_percentage.toString()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setThresholdHandler(e);
                        }
                      }}
                      onBlur={(e) => setThresholdHandler(e)}
                    />
                  </TableCell>
                  <TableCell
                    align={"right"}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Button
                      name={`${ele.coin}_transfer`}
                      intent={
                        reached_threshold
                          ? to_balance_direction === "Buy"
                            ? "success"
                            : "danger"
                          : undefined
                      }
                      onClick={(e) => {
                        transferFundsHandler(e, ele.coin, idx);
                      }}
                    >
                      <div style={{ marginTop: 3 }}>{to_balance_text}</div>
                      <div style={{ fontSize: 12, marginTop: 1 }}>
                        {to_balance_text2}
                      </div>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          : null}
      </>
    );
  };

  const font_size = 12;
  const tableCellStyle = { fontSize: `${font_size}px` };

  return (
    <div>
      {!globalState.portfolio?.length ||
      Object.keys(prices).length === 0 ? null : (
        <Container fluid style={{ paddingLeft: "40px", paddingRight: "40px" }}>
          <Row
            style={{
              margin: "20px 20px 20px 0px",
              fontSize: "16px",
              color: "#000000",
            }}
          >
            <Col xs={12} style={{ paddingLeft: "0px" }}>
              {"Rebalance"}
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <TableContainer component={Paper}>
                <Table
                  sx={{ minWidth: 650 }}
                  size="small"
                  aria-label="a dense table"
                >
                  <TableHeader />
                  <TableBody />
                </Table>
              </TableContainer>
            </Col>
          </Row>
          <Row style={{ marginTop: "20px" }}>
            <Col xs={12}>
              <TableContainer component={Paper}>
                <Table>
                  <TableRow>
                    <TableCell>
                      <PortfolioPieChart
                        width={width - 150}
                        height={600}
                        prices={prices}
                      />
                    </TableCell>
                  </TableRow>
                </Table>
              </TableContainer>
            </Col>
          </Row>
        </Container>
      )}
    </div>
  );
};
