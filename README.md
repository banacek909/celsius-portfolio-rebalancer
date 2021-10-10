# Celsius Portfolio Rebalancer

This is an app made in order to aid in portfolio rebalancing of assets held in a Celsius Network wallet.\
It does not rebalance your portfolio in your Celsius wallet but calculates the transfer of funds needed to achieve a target asset weighting.
With the release of Celsius Swap, rebalancing your portfolio should be a lot easier to do in the Celsius app.

I added a risk analysis page and implemented a backtester to visualise and compare various rebalancing strategies: periodic, threshold percent and dollar cost averaging.

The risk analysis page calculates the Kelly Criterion as described and discussed in the following video on the Celsius Daily youTube channel:

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
