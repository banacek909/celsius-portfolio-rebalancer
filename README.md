# Celsius Portfolio Rebalancer

This is an application made in order to aid in the portfolio rebalancing of assets held in a Celsius Network wallet.

Rebalancing is the process of realigning the weightings of a portfolio of assets. Rebalancing involves periodically buying or selling assets in a portfolio to maintain an original or desired level of asset allocation or risk.

It currently does not connect to your Celsius wallet but calculates the transfer of funds needed to achieve a desired target asset weighting.
With the release and rollout of Celsius Swap, this tool should help in rebalancing your portfolio within the Celsius app.

The backtester uses historical market data to calculate how well a strategy would have performed in the past. It allows you to analyse and compare various rebalancing strategies: periodic, threshold percent and dollar cost averaging.

The risk analysis page shows the past performance of a coin and calculates the Kelly Criterion percentage which can be used to determine an asset's risk and weighting in a portfolio.\
The Kelly Criterion is a mathematical formula that helps investors calculate what percentage of their money they should allocate to each investment. 
The calculation is based on the following video on the Celsius Daily youTube channel:

Celsian Interview - Marc Mayor - Ex Wall Street Analyst - Celsius Portfolio Kelly Criterion - Ep 14\
https://www.youtube.com/watch?v=ddK8kdtHENk&t=3557s

## Getting Started

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.

### `yarn test`

Launches the test runner in the interactive watch mode.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.
