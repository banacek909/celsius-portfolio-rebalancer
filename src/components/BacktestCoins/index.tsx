import React, { ReactElement, useContext } from "react";
import { InputGroup, ProgressBar } from "@blueprintjs/core";

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

import { getPortfolioTotals } from "../../utils";

import { BacktestMultiSelectCoin } from "../Select/BacktestMultiSelectCoin";

const BacktestCoins = (prices: Prices, type: string): ReactElement => {
  const { globalState, dispatch } = useContext(globalContext);

  const setValueHandler = (e: React.BaseSyntheticEvent) => {
    const regex = /^[0-9\.]+$/;
    if (regex.test(e.target.defaultValue)) {
      const [coin, value] = e.target.name.split("_");
      dispatch({
        type: "SET_BACKTEST_COIN_VALUE",
        payload: { coin: coin, value: parseFloat(e.target.defaultValue) },
      });
    }
  };

  const setTargetHandler = (e: React.BaseSyntheticEvent) => {
    //}: /*React.ChangeEvent<HTMLInputElement> |*/ React.KeyboardEvent<HTMLInputElement>) => {
    const regex = /^[0-9]+$/;
    if (regex.test(e.target.defaultValue)) {
      const [coin, target] = e.target.name.split("_");
      dispatch({
        type: "SET_BACKTEST_COIN_TARGET_PERCENT",
        payload: { coin: coin, percent: parseFloat(e.target.defaultValue) },
      });
    }
  };

  const TableHeader = () => {
    return (
      <TableHead>
        <TableRow>
          <TableCell style={tableCellStyle}>
            <b>Coin</b>
          </TableCell>
          <TableCell style={tableCellStyle}>
            <b>Current Price</b>
          </TableCell>
          <TableCell
            style={{ ...tableCellStyle, width: "200px" }}
            align="right"
          >
            <b>Coin Value $</b>
          </TableCell>
          <TableCell style={tableCellStyle} align="right">
            <b>Current %</b>
          </TableCell>
          <TableCell
            style={{ ...tableCellStyle, width: "200px" }}
            align="right"
          >
            <b>Reallocation Target %</b>
          </TableCell>
        </TableRow>
      </TableHead>
    );
  };

  const {
    total_value,
    total_percent_allocated,
    total_percent_unallocated,
    allocated_amounts_targets,
  } = getPortfolioTotals(prices, globalState.backtest.portfolio, true);

  const TableBody = () => {
    return (
      <>
        {globalState.backtest.portfolio?.length
          ? globalState.backtest.portfolio.map((ele) => {
              const style = {
                display: "flex",
                alignItems: "center",
                height: 40,
              };

              const small_image = Logos[ele.coin];
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
                  <TableCell>
                    {numeral(prices[ele.coin]).format("$0,0.00")}
                  </TableCell>
                  <TableCell align="right">
                    <InputGroup
                      type="number"
                      asyncControl={true}
                      name={`${ele.coin}_value`}
                      style={{ width: "150px" }}
                      value={ele.value
                        .toFixed(8)
                        .toString()
                        .replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, "$1")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setValueHandler(e);
                        }
                      }}
                      onBlur={(e) => setValueHandler(e)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {total_value
                      ? numeral((ele.value / total_value) * 100).format("0.0") +
                        "%"
                      : null}
                  </TableCell>
                  <TableCell>
                    <InputGroup
                      type="number"
                      asyncControl={true}
                      name={`${ele.coin}_target`}
                      value={ele.rebalance.percent?.toString()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setTargetHandler(e);
                        }
                      }}
                      onBlur={(e) => setTargetHandler(e)}
                    />
                    <ProgressBar
                      animate={false}
                      stripes={false}
                      value={
                        ele.rebalance.percent ? ele.rebalance.percent / 100 : 0
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })
          : null}
      </>
    );
  };

  const Totals = () => {
    return (
      <TableRow key={"totals"}>
        <TableCell style={tableCellStyle}></TableCell>
        <TableCell></TableCell>
        <TableCell align="right">
          <b>{numeral(total_value).format("$0,0.00")}</b>
        </TableCell>
        <TableCell></TableCell>
        <TableCell>
          <b>
            {!allocated_amounts_targets ? (
              <div style={{ color: "#cc0000" }}>{`Unallocated Coin`}</div>
            ) : total_percent_allocated === 100 ? (
              `${total_percent_allocated} % Allocated`
            ) : total_percent_allocated === 0 ? (
              `${total_percent_allocated} % Allocated`
            ) : (
              <>
                <div
                  style={{ color: "#cc0000" }}
                >{`${total_percent_allocated} % Allocated,`}</div>
                <div
                  style={{ color: "#cc0000" }}
                >{`${total_percent_unallocated} % Unallocated`}</div>
              </>
            )}
          </b>
        </TableCell>
      </TableRow>
    );
  };

  const font_size = 12;
  const tableCellStyle = { fontSize: `${font_size}px` };

  return (
    <Container fluid style={{ paddingLeft: "40px", paddingRight: "40px" }}>
      <Row style={{ marginBottom: "20px" }}>
        <Col
          xs={12}
          style={{
            fontSize: "16px",
            marginRight: "20px",
            marginBottom: "10px",
          }}
        >
          <div>{"Backtest Portfolio"}</div>
        </Col>
        <Col xs={12}>
          <BacktestMultiSelectCoin />
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
              <Totals />
            </Table>
          </TableContainer>
        </Col>
      </Row>
    </Container>
  );
};

export default BacktestCoins;
