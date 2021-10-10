import { ActionType, GlobalStateInterface, PortfolioCoin } from "./types";
import { initialState } from "./index";

import moment from "moment";

const ImmerReducer = (draft: GlobalStateInterface, action: ActionType): any => {
  switch (action.type) {
    case "ADD_COIN":
      draft.portfolio = action.payload;
      break;
    case "REMOVE_COIN":
      draft.portfolio = action.payload;
      break;
    case "ADD_BACKTEST_COIN":
      draft.backtest.portfolio = action.payload;
      break;
    case "REMOVE_BACKTEST_COIN":
      draft.backtest.portfolio = action.payload;
      break;
    case "SET_COIN_AMOUNT":
      let coinObj: PortfolioCoin | undefined = draft.portfolio.find(
        (obj) => obj.coin === action.payload.coin
      );
      if (coinObj) {
        coinObj.amount = action.payload.amount;
      }
      break;
    case "SET_BACKTEST_COIN_VALUE":
      let coinObj2: PortfolioCoin | undefined = draft.backtest.portfolio.find(
        (obj) => obj.coin === action.payload.coin
      );
      if (coinObj2) {
        coinObj2.value = action.payload.value;
      }
      break;
    case "SET_COIN_THRESHOLD":
      let coinObj3: PortfolioCoin | undefined = draft.portfolio.find(
        (obj) => obj.coin === action.payload.coin
      );
      if (coinObj3) {
        coinObj3.rebalance.threshold = action.payload.threshold;
      }
      break;
    case "SET_COIN_TARGET_PERCENT":
      let coinObj4: PortfolioCoin | undefined = draft.portfolio.find(
        (obj) => obj.coin === action.payload.coin
      );
      if (coinObj4) {
        coinObj4.rebalance.percent = action.payload.percent;
      }
      break;
    case "SET_BACKTEST_COIN_TARGET_PERCENT":
      let coinObj5: PortfolioCoin | undefined = draft.backtest.portfolio.find(
        (obj) => obj.coin === action.payload.coin
      );
      if (coinObj5) {
        coinObj5.rebalance.percent = action.payload.percent;
      }
      break;
    case "SET_BACKTEST":
      draft.backtest.results = action.payload;
      draft.backtest.chart.display = "portfolio";
      draft.backtest.results.backtested_portfolio = draft.backtest.portfolio;
      break;
    case "SET_BACKTEST_CHART":
      draft.backtest.chart.display = action.payload.display;
      break;
    case "SET_BACKTEST_FROM_DATE":
      const diff_days = moment
        .duration(moment(draft.backtest.to).diff(moment(action.payload.from)))
        .asDays();
      if (diff_days < 90 || diff_days < 0) {
        draft.backtest.from = moment(draft.backtest.to)
          .add(-3, "months")
          .toDate();
      } else {
        draft.backtest.from = action.payload.from;
      }
      break;
    case "SET_BACKTEST_TO_DATE":
      const diff_days2 = moment
        .duration(moment(action.payload.to).diff(moment(draft.backtest.from)))
        .asDays();
      if (diff_days2 < 90 || diff_days2 < 0) {
        draft.backtest.from = moment(action.payload.to)
          .add(-3, "months")
          .toDate();
      }
      draft.backtest.to = action.payload.from;
      break;
    case "SET_BACKTEST_DCA_PERIOD":
      draft.backtest.dca.period = action.payload.period;
      break;
    case "SET_BACKTEST_DCA_AMOUNT":
      draft.backtest.dca.amount = action.payload.amount;
      if (action.payload.amount > 0) {
        draft.backtest.chart.legend.portfolio.dca = 1;
        draft.backtest.chart.legend.portfolio.rebalance.period_dca = [1, 1, 1];
        draft.backtest.chart.legend.portfolio.rebalance.threshold_dca = [
          1, 1, 1,
        ];

        draft.backtest.chart.legend.coin.dca = 1;
        draft.backtest.chart.legend.coin.rebalance.period_dca = [1, 1, 1];
        draft.backtest.chart.legend.coin.rebalance.threshold_dca = [1, 1, 1];
      } else {
        draft.backtest.chart.legend.portfolio.dca = 0;
        draft.backtest.chart.legend.portfolio.rebalance.period_dca = [0, 0, 0];
        draft.backtest.chart.legend.portfolio.rebalance.threshold_dca = [
          0, 0, 0,
        ];

        draft.backtest.chart.legend.coin.dca = 0;
        draft.backtest.chart.legend.coin.rebalance.period_dca = [0, 0, 0];
        draft.backtest.chart.legend.coin.rebalance.threshold_dca = [0, 0, 0];
      }
      break;
    case "SET_BACKTEST_REBALANCE_PERIODS":
      draft.backtest.rebalance.periods = action.payload.periods
        .split(",")
        .map((p: string) => parseInt(p));
      break;
    case "SET_BACKTEST_REBALANCE_THRESHOLDS":
      draft.backtest.rebalance.thresholds = action.payload.thresholds
        .split(",")
        .map((t: string) => parseInt(t));
      break;
    case "SET_RISK_ANALYSIS_COIN":
      draft.riskAnalysis.coin = action.payload.coin;
      break;
    case "SET_RISK_ANALYSIS_FROM_DATE":
      const diff_days3 = moment
        .duration(
          moment(draft.riskAnalysis.to).diff(moment(action.payload.from))
        )
        .asDays();

      if (diff_days3 < 90 || diff_days3 < 0) {
        draft.riskAnalysis.from = moment(draft.riskAnalysis.to)
          .add(-3, "months")
          .toDate();
      } else {
        draft.riskAnalysis.from = action.payload.from;
      }
      break;
    case "SET_RISK_ANALYSIS_TO_DATE":
      const diff_days4 = moment
        .duration(
          moment(action.payload.to).diff(moment(draft.riskAnalysis.from))
        )
        .asDays();
      if (diff_days4 < 90 || diff_days4 < 0) {
        draft.riskAnalysis.from = moment(action.payload.to)
          .add(-3, "months")
          .toDate();
      }
      draft.riskAnalysis.to = action.payload.from;
      break;
    case "SET_RISK_ANALYSIS_PERIOD":
      draft.riskAnalysis.period = action.payload.period;
      break;
    case "SET_RISK_ANALYSIS_RESULTS":
      draft.historicalPrices[action.payload.coin] = {
        from: action.payload.from,
        to: action.payload.to,
        prices: action.payload.prices,
      };

      draft.riskAnalysis.results[action.payload.coin] = {
        from: action.payload.from,
        to: action.payload.to,
        prices: action.payload.prices,
        monthly: action.payload.results.monthly,
        weekly: action.payload.results.weekly,
      };
      break;
    case "SET_BACKTEST_PORTFOLIO":
      draft.backtest.portfolio = draft.portfolio;
      draft.portfolio.forEach((p: PortfolioCoin, i: number) => {
        draft.backtest.portfolio[i].value = p.rebalance.percent * 10;
      });
      break;
    case "TOGGLE_BACKTEST_CHART_LEGEND":
      const p =
        action.payload.chart_type === "portfolio"
          ? draft.backtest.chart.legend.portfolio
          : draft.backtest.chart.legend.coin;

      if (action.payload.line === "dca") {
        p.dca = p.dca ? 0 : 1;
      } else if (action.payload.line === "period") {
        p.rebalance.period[action.payload.number] = p.rebalance.period[
          action.payload.number
        ]
          ? 0
          : 1;
      } else if (action.payload.line === "threshold") {
        p.rebalance.threshold[action.payload.number] = p.rebalance.threshold[
          action.payload.number
        ]
          ? 0
          : 1;
      } else if (action.payload.line === "period_dca") {
        p.rebalance.period_dca[action.payload.number] = p.rebalance.period_dca[
          action.payload.number
        ]
          ? 0
          : 1;
      } else if (action.payload.line === "threshold_dca") {
        p.rebalance.threshold_dca[action.payload.number] = p.rebalance
          .threshold_dca[action.payload.number]
          ? 0
          : 1;
      } else if (action.payload.group === "period") {
        if (p.rebalance.period.indexOf(1) !== -1) {
          p.rebalance.period.fill(0);
        } else {
          p.rebalance.period.fill(1);
        }
      } else if (action.payload.group === "threshold") {
        if (p.rebalance.threshold.indexOf(1) !== -1) {
          p.rebalance.threshold.fill(0);
        } else {
          p.rebalance.threshold.fill(1);
        }
      } else if (action.payload.group === "period_dca") {
        if (p.rebalance.period_dca.indexOf(1) !== -1) {
          p.rebalance.period_dca.fill(0);
        } else {
          p.rebalance.period_dca.fill(1);
        }
      } else if (action.payload.group === "threshold_dca") {
        if (p.rebalance.threshold_dca.indexOf(1) !== -1) {
          p.rebalance.threshold_dca.fill(0);
        } else {
          p.rebalance.threshold_dca.fill(1);
        }
      }
      break;
    case "TOGGLE_SAVE_SESSION":
      draft.session.save = !draft.session.save;
      if (!draft.session.save) {
        const getPersistenceType = draft.session.persistenceType;
        if (getPersistenceType === "sessionStorage") {
          sessionStorage.removeItem("globalState");
        } else if (getPersistenceType === "localStorage") {
          localStorage.removeItem("globalState");
        }
      }
      break;
    case "SET_PERSISTENCE":
      draft.session.persistenceType = action.payload;
      break;
    case "PURGE_STATE":
      draft = initialState;
      break;
    default:
      break;
  }
};

export default ImmerReducer;
