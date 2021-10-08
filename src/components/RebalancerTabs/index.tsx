import React, { ReactElement } from "react";

import { useHistory } from "react-router";

import { Tab, Tabs, FocusStyleManager } from "@blueprintjs/core";

import { Container, Row, Col } from "react-grid-system";

const RebalancerTabs = ({
  selectedIndex,
}: {
  selectedIndex: number;
}): ReactElement => {
  FocusStyleManager.onlyShowFocusOnTabs();

  const history = useHistory();

  const handleTabChange = (idx: number) => {
    if (idx === 0) {
      history.push("/");
    } else if (idx === 1) {
      history.push("/backtest");
    } else if (idx === 2) {
      history.push("/risk");
    }
  };

  return (
    <Container
      fluid
      style={{ paddingTop: "20px", paddingLeft: "40px", paddingRight: "40px" }}
    >
      <Col xs={12}>
        <Row>
          <div
            style={{
              fontSize: "16px",
              paddingLeft: "15px",
              marginBottom: "20px",
            }}
          >
            Celsius Portfolio Rebalancer
          </div>
        </Row>
      </Col>

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
          <Tabs selectedTabId={selectedIndex} onChange={handleTabChange}>
            <Tab id={0} title="Rebalancer" />
            <Tab id={1} title="Backtest" />
            <Tab id={2} title="Risk Analysis" />
          </Tabs>
        </Row>
      </Col>
    </Container>
  );
};

export default RebalancerTabs;
