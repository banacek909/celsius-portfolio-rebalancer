import React, {
  createContext,
  ReactElement,
  ReactNode,
  //useEffect,
  //useReducer,
} from "react";
import { useImmerReducer } from "use-immer";
//import produce from "immer";
import ImmerReducer from "./reducer";
import { ContextType, GlobalStateInterface, PortfolioCoin } from "./types";

import moment from "moment";

/**
 * React Context-based Global Store with a reducer
 * and persistent saves to sessionStorage/localStorage
 **/
export function GlobalStore({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [globalState, dispatch] = useImmerReducer(
    ImmerReducer,
    initializeState()
  );

  /*useEffect(() => {
   */ /*
     populate either sessionStorage or localStorage data from globalState based on persistenceType
     and purge sessionStorage or localStorage globalState key/value pair when either is selected
    */

  // the backtest results data can be large so exclude from sessionStorage/localStorage
  /*
    const sessionState = produce(globalState, (draft: GlobalStateInterface) => {
      draft.backtest.results.portfolio = [];
      draft.backtest.results.coin = {};
    });

    const getPersistenceType = globalState.persistenceType;
    if (getPersistenceType === "sessionStorage") {
      sessionStorage.setItem("globalState", JSON.stringify(sessionState));
      localStorage.removeItem("globalState");
    } else if (getPersistenceType === "localStorage") {
      localStorage.setItem("globalState", JSON.stringify(sessionState));
      sessionStorage.removeItem("globalState");
    }
  }, [globalState]);
*/
  return (
    <globalContext.Provider value={{ globalState, dispatch }}>
      {children}
    </globalContext.Provider>
  );
}

export const globalContext = createContext({} as ContextType);

/*************************************************************************************************/

const portfolio: PortfolioCoin[] = [
  {
    coin: "BTC",
    amount: 0.1,
    value: 1000,
    rebalance: {
      threshold: 1,
      percent: 30,
      value: 0,
    },
  },
  {
    coin: "ETH",
    amount: 2,
    value: 1000,
    rebalance: {
      threshold: 1,
      percent: 20,
      value: 0,
    },
  },
  {
    coin: "CEL",
    amount: 500,
    value: 1000,
    rebalance: {
      threshold: 1,
      percent: 50,
      value: 0,
    },
  },
];

let from_date = moment().add(-12, "months").toDate();

export const initialState: GlobalStateInterface = {
  portfolio,
  backtest: {
    from: from_date,
    to: new Date(),
    portfolio,
    dca: { amount: 0, period: 7 },
    rebalance: {
      periods: [1, 7, 14], //[1, 3, 7, 14, 30],
      thresholds: [1, 5, 10],
    },
    results: {
      from: from_date,
      to: new Date(),
      dca: { amount: 0, period: 0 },
      backtested_portfolio: portfolio,
      rebalance: {
        periods: [1, 7, 14], //[1, 3, 7, 14, 30],
        thresholds: [1, 5, 10],
      },
      coin: {},
      portfolio: [],
      stats: null,
    },
    chart: {
      display: "portfolio",
      legend: {
        portfolio: {
          buy_and_hold: 1,
          dca: 0,
          rebalance: {
            period: [1, 1, 1],
            threshold: [1, 1, 1],
            period_dca: [0, 0, 0],
            threshold_dca: [0, 0, 0],
          },
        },
        coin: {
          buy_and_hold: 1,
          dca: 1,
          rebalance: {
            period: [1, 1, 1],
            threshold: [1, 1, 1],
            period_dca: [0, 0, 0],
            threshold_dca: [0, 0, 0],
          },
        },
      },
    },
  },
  riskAnalysis: {
    from: from_date,
    to: new Date(),
    coin: "BTC",
    period: "monthly",
    results: {},
  },
  historicalPrices: {},
  persistenceType: "sessionStorage",
};

/*************************************************************************************************/

function initializeState() {
  /*
   the order in which the data is compared is very important;
   first try to populate the state from Storage if not set load initialState
  */
  const fromLocalStorage = JSON.parse(
    localStorage.getItem("globalState") as string
  );
  const fromSessionStorage = JSON.parse(
    sessionStorage.getItem("globalState") as string
  );
  return fromSessionStorage || fromLocalStorage || initialState;
}
