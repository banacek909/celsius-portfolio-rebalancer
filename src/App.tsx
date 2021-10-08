//import React from "react";
import "./App.css";

import { Switch, Route } from "react-router-dom";

import Rebalance from "./components/Rebalance";
import Backtest from "./components/Backtest";
import RiskAnalysis from "./components/RiskAnalysis";
import RebalancerTabs from "./components/RebalancerTabs";

function App() {
  return (
    <Switch>
      <Route exact path="/">
        <RebalancerTabs selectedIndex={0} />
        <Rebalance type={"rebalance"} />
      </Route>
      <Route exact path="/backtest">
        <RebalancerTabs selectedIndex={1} />
        <Rebalance type={"backtest"} />
        <Backtest />
      </Route>
      <Route exact path="/risk">
        <RebalancerTabs selectedIndex={2} />
        <RiskAnalysis />
      </Route>
    </Switch>
  );
}

export default App;
