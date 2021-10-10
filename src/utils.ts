import { Prices } from "./components/Rebalance/types";
import { PortfolioCoin } from "./store/types";
import { timeFormat } from "d3-time-format";

import { scaleThreshold } from "@visx/scale";
import { max, min } from "d3-array";

import { BackTestData } from "./data";

import { BacktestDcaType, BacktestRebalanceType } from "./store/types";

import moment from "moment";

type BacktestStatsValues = {
  date: Date;
  value: number;
  profit_pc: number;
};

type BacktestMinMaxStats = {
  min: BacktestStatsValues;
  max: BacktestStatsValues;
};

export type BacktestPortfolioStats = {
  buy_and_hold: BacktestMinMaxStats;
  dca: BacktestMinMaxStats;
  rebalanced_period: { [period: number]: BacktestMinMaxStats };
  rebalanced_threshold: { [threshold: number]: BacktestMinMaxStats };
  rebalanced_period_dca: { [period: number]: BacktestMinMaxStats };
  rebalanced_threshold_dca: { [period: number]: BacktestMinMaxStats };
};

export type BacktestStats = {
  portfolio: BacktestPortfolioStats;
  coin: { [coin: string]: BacktestPortfolioStats };
} | null;

export const getPortfolioTotals = (
  prices: Prices,
  portfolio_coins: PortfolioCoin[],
  backtest: boolean
): {
  total_value: number | null;
  total_percent_allocated: number | null;
  total_percent_unallocated: number;
  allocated_amounts_targets: boolean;
} => {
  let total_value: number = 0;
  let total_percent_allocated: number = 0;
  let allocated_amounts_targets: boolean = true;

  portfolio_coins.forEach((p) => {
    if (backtest) {
      total_value += p.value;
      if (
        allocated_amounts_targets &&
        (p.value === 0 || p.rebalance.percent === 0)
      ) {
        allocated_amounts_targets = false;
      }
    } else {
      total_value += prices[p.coin] * p.amount;
      if (
        allocated_amounts_targets &&
        (p.amount === 0 || p.rebalance.percent === 0)
      ) {
        allocated_amounts_targets = false;
      }
    }
    total_percent_allocated += p.rebalance.percent;
  });

  let total_percent_unallocated = 100;
  total_percent_unallocated -= total_percent_allocated;

  return {
    total_value,
    total_percent_allocated,
    total_percent_unallocated,
    allocated_amounts_targets,
  };
};

export const getProfitPercentage = (
  start_amount: number,
  end_amount: number
) => {
  return start_amount ? (end_amount / start_amount - 1) * 100 : 0;
};

const getDcaValues = (
  coin: PortfolioCoin,
  price: number,
  total_value: number
): {
  dca_amount: number | null;
  dca_value: number | null;
} => {
  const target_percentage = coin.rebalance.percent;

  const target_value = target_percentage
    ? total_value * (target_percentage / 100)
    : null;
  const target_amount = target_value ? target_value / price : null;

  return {
    dca_amount: target_amount || 0,
    dca_value: target_value || 0,
  };
};

export const getRebalanceAmounts = (
  coin: PortfolioCoin,
  price: number,
  amount: number,
  total_value: number
): {
  current_percentage: number;
  target_percentage: number | null;
  difference_percentage: number | null;
  threshold_percentage: number;
  reached_threshold: boolean;
  target_value: number | null;
  target_amount: number | null;
  to_balance_value: number | null;
  to_balance_amount: number | null;
  to_balance_direction: string;
} => {
  const current_percentage = ((price * amount) / total_value) * 100;
  const target_percentage = coin.rebalance.percent;
  const difference_percentage = target_percentage
    ? current_percentage - target_percentage
    : null;
  const threshold_percentage = coin.rebalance.threshold;
  const reached_threshold =
    difference_percentage &&
    Math.abs(difference_percentage) >= threshold_percentage
      ? true
      : false;
  const current_value = price * amount;

  const target_value = target_percentage
    ? total_value * (target_percentage / 100)
    : null;
  const target_amount = target_value ? target_value / price : null;

  const to_balance_value = target_value ? target_value - current_value : null;
  const to_balance_amount = target_amount ? target_amount - amount : null;
  const to_balance_direction =
    to_balance_value && to_balance_value > 0 ? "Buy" : "Sell";

  return {
    current_percentage,
    target_percentage,
    difference_percentage,
    threshold_percentage,
    reached_threshold,
    target_value,
    target_amount,
    to_balance_value,
    to_balance_amount,
    to_balance_direction,
  };
};

type BuyAndHoldValues = {
  amount: number;
  value: number;
  profit_pc: number;
};

type RebalanceValues = {
  amount: number;
  coin_value: number;
  profit_pc: number;
  difference_pc: number;
  usd_amount: number;
  total_value: number;
};

type RebalancePeriod = { [period: number]: RebalanceValues };
type RebalanceThreshold = { [threshold: number]: RebalanceValues };

type TotalBuyAndHoldValues = {
  value: number;
  profit_pc: number;
};

type TotalRebalancePeriodValues = {
  coin_value: number;
  profit_pc: number;
  usd_amount: number;
  total_value: number;
};

type TotalRebalanceThresholdValues = {
  rebalanced_threshold_pc: { [coin: string]: number };
  coin_value: number;
  profit_pc: number;
  usd_amount: number;
  total_value: number;
};

type TotalRebalancePeriod = { [period: number]: TotalRebalancePeriodValues };
type TotalRebalanceThreshold = {
  [threshold: number]: TotalRebalanceThresholdValues;
};

export type RiskAnalysis = {
  date: string;
  open: number;
  month_to_month_performance: number;
  positive_month: number;
  negative_month: number;
  winning_month_performance: number;
  losing_month_performance: number;
  heatmap: number;
  kc: number;
};

export const getRiskAnalysisData = (
  prices: [number, number][] | undefined,
  period: "monthly" | "weekly"
): RiskAnalysis[] | undefined => {
  let previous_price = 0;
  if (!prices) {
    return;
  }
  let data: RiskAnalysis[] = [];

  if (period === "monthly") {
    prices.forEach((p) => {
      const date = new Date(p[0]);
      console.log(period, ': date: ', date, 'date.getDate():' , date.getDate(), ' moment(date).date(): ', moment(date).date());
      if (date.getDate() === 1) {
        // first of the month
        let profit_pc =
          previous_price !== 0 ? getProfitPercentage(previous_price, p[1]) : 0;
        data.push({
          //date: date.toISOString().substring(0, 10);
          date: timeFormat("%b %d %Y")(date),
          open: p[1],
          month_to_month_performance: profit_pc,
          positive_month: profit_pc > 0 ? 1 : 0,
          negative_month: profit_pc < 0 ? 1 : 0,
          winning_month_performance: profit_pc > 0 ? profit_pc : 0,
          losing_month_performance: profit_pc < 0 ? profit_pc : 0,
          heatmap: 0,
          kc: 0,
        });
        previous_price = p[1];
      }
    });
  } else if (period === "weekly") {
    prices.forEach((p) => {
      const date = new Date(p[0]);
      console.log(period, ': date: ', date, 'date.getDate():' , date.getDate(), ' moment(date).day(): ', moment(date).day());
      if (moment(date).day() === 1) {
        // every Monday
        let profit_pc =
          previous_price !== 0 ? getProfitPercentage(previous_price, p[1]) : 0;
        data.push({
          //date: date.toISOString().substring(0, 10);
          date: timeFormat("%b %d %Y")(date),
          open: p[1],
          month_to_month_performance: profit_pc,
          positive_month: profit_pc > 0 ? 1 : 0,
          negative_month: profit_pc < 0 ? 1 : 0,
          winning_month_performance: profit_pc > 0 ? profit_pc : 0,
          losing_month_performance: profit_pc < 0 ? profit_pc : 0,
          heatmap: 0,
          kc: 0,
        });
        previous_price = p[1];
      }
    });
  }

  // calculate averages & kelly criterion

  const average_m2m_performance =
    data.reduce((total, next) => total + next.month_to_month_performance, 0) /
    (data.length - 1);
  const average_positive_month =
    data.reduce((total, next) => total + next.positive_month, 0) /
    (data.length - 1);
  const average_negative_month =
    data.reduce((total, next) => total + next.negative_month, 0) /
    (data.length - 1);
  const average_winning_month =
    data.reduce((total, next) => total + next.winning_month_performance, 0) /
    (data.length - 1);
  const average_losing_month =
    data.reduce((total, next) => total + next.losing_month_performance, 0) /
    (data.length - 1);

  const b = average_winning_month / Math.abs(average_losing_month);
  const kelly_criterion = b
    ? (average_positive_month - average_negative_month / b) * 100
    : -Infinity;

  const average_so_far: RiskAnalysis = {
    date: "Average so far",
    open: 0,
    month_to_month_performance: average_m2m_performance,
    positive_month: average_positive_month,
    negative_month: average_negative_month,
    winning_month_performance: average_winning_month,
    losing_month_performance: average_losing_month,
    heatmap: 0,
    kc: kelly_criterion,
  };

  // accessors
  const getWinningMonthPerformance = (d: RiskAnalysis) =>
    d.winning_month_performance;
  const getLosingMonthPerformance = (d: RiskAnalysis) =>
    d.losing_month_performance;

  const getHeatmapScale = (
    accessor: (d: RiskAnalysis) => number,
    positive: boolean
  ) => {
    const m2m_performance_min = min(data, accessor) || 0;
    const m2m_performance_max = max(data, accessor) || 0;
    const range = m2m_performance_max - m2m_performance_min;
    const thresholds = 5;
    const threshold_size = range / thresholds;
    let threshold_domain: number[] = [];
    for (
      let i = m2m_performance_min, d = m2m_performance_min;
      i < thresholds;
      i++
    ) {
      d += threshold_size;
      threshold_domain.push(d);
    }
    return scaleThreshold({
      domain: threshold_domain,
      range: positive ? [0, 1, 2, 3, 4] : [4, 3, 2, 1, 0],
    });
  };

  const winning_scale = getHeatmapScale(getWinningMonthPerformance, true);
  const losing_scale = getHeatmapScale(getLosingMonthPerformance, false);

  data.forEach((d: RiskAnalysis, index) => {
    data[index].heatmap =
      d.winning_month_performance > 0
        ? winning_scale(d.winning_month_performance)
        : losing_scale(d.losing_month_performance);
  });
  data.unshift(average_so_far);
  return data;
};

export const getBacktestRebalanceValues = (
  coin: PortfolioCoin,
  price: number,
  rebalanced_amount: number,
  rebalanced_total_value: number,
  threshold_percentage: number
): {
  to_balance_value: number;
  to_balance_amount: number;
  rebalanced_difference_percentage: number;
  reached_threshold: boolean;
  target_value: number;
  target_amount: number;
} => {
  const target_percentage = coin.rebalance.percent;

  const rebalanced_current_percentage =
    ((price * rebalanced_amount) / rebalanced_total_value) * 100;
  const rebalanced_difference_percentage = target_percentage
    ? rebalanced_current_percentage - target_percentage
    : 0;

  const reached_threshold =
    !threshold_percentage ||
    (rebalanced_difference_percentage &&
      Math.abs(rebalanced_difference_percentage) >= threshold_percentage)
      ? true
      : false;
  const current_value = price * rebalanced_amount;

  const target_value = target_percentage
    ? rebalanced_total_value * (target_percentage / 100)
    : 0;
  const target_amount = target_value ? target_value / price : 0;

  const to_balance_value = target_value ? target_value - current_value : 0;
  const to_balance_amount = target_amount
    ? target_amount - rebalanced_amount
    : 0;

  return {
    to_balance_value,
    to_balance_amount,
    rebalanced_difference_percentage,
    reached_threshold,
    target_value,
    target_amount,
  };
};

export const getTimeframeHours = (date1: number, date2: number): number => {
  let firstDate = new Date(date1);
  let secondDate = new Date(date2);
  let diff = secondDate.getTime() - firstDate.getTime();
  let hours = diff / (1000 * 60 * 60); // number of hours
  return hours;
};

export const getRebalancePeriod = (
  date1: number,
  date2: number,
  rebalanceHours: number
): number => {
  const time_frame_hours = getTimeframeHours(date1, date2);
  if (time_frame_hours) {
    return rebalanceHours / time_frame_hours;
  }
  return 0;
};

export type BacktestCoinResult = {
  date: Date;
  buy_and_hold: BuyAndHoldValues;
  dca: BuyAndHoldValues;
  rebalanced_period: RebalancePeriod;
  rebalanced_threshold: RebalanceThreshold;
  rebalanced_period_dca: RebalancePeriod;
  rebalanced_threshold_dca: RebalanceThreshold;
};

export type BacktestCoinResults = {
  [coin: string]: BacktestCoinResult[];
};

export type BacktestPortfolioResults = {
  date: Date;
  buy_and_hold: TotalBuyAndHoldValues;
  dca: TotalBuyAndHoldValues;
  rebalanced_period: TotalRebalancePeriod;
  rebalanced_threshold: TotalRebalanceThreshold;
  rebalanced_period_dca: TotalRebalancePeriod;
  rebalanced_threshold_dca: TotalRebalanceThreshold;
};

export type BackTestResults = {
  from: Date;
  to: Date;
  rebalance: BacktestRebalanceType;
  dca: BacktestDcaType;
  coin: BacktestCoinResults;
  portfolio: BacktestPortfolioResults[];
  stats: BacktestStats;
};

export const backtest = (
  from: Date,
  to: Date,
  rebalance: BacktestRebalanceType,
  dca: BacktestDcaType,
  historical_data: BackTestData,
  rebalanceHours: number,
  portfolio_coins: PortfolioCoin[]
): BackTestResults => {
  let results: BackTestResults = {
    from: from,
    to: to,
    rebalance: rebalance,
    dca: dca,
    coin: {},
    portfolio: [],
    stats: null,
  };

  const rebalance_periods = rebalance.periods; //[1, 7, 14];
  const rebalance_thresholds = rebalance.thresholds; //[1, 5, 10];

  const num_rebalance_periods = rebalance_periods.length;
  const num_rebalance_thresholds = rebalance_thresholds.length;

  // get initial portfolio coin amounts
  type PriceMap = { [coin: string]: number };
  const initial_amounts: PriceMap = {};
  let initial_value = 0;

  type PortfolioTotals = {
    buy_and_hold: TotalBuyAndHoldValues;
    dca: TotalBuyAndHoldValues;
    rebalanced_period: TotalRebalancePeriod;
    rebalanced_threshold: TotalRebalanceThreshold;
    rebalanced_period_dca: TotalRebalancePeriod;
    rebalanced_threshold_dca: TotalRebalanceThreshold;
  };

  let portfolio_total: PortfolioTotals = {
    buy_and_hold: {
      value: 0,
      profit_pc: 0,
    },
    dca: {
      value: 0,
      profit_pc: 0,
    },
    rebalanced_period: {},
    rebalanced_threshold: {},
    rebalanced_period_dca: {},
    rebalanced_threshold_dca: {},
  };

  rebalance_periods.forEach((rp) => {
    portfolio_total.rebalanced_period[rp] = {
      coin_value: 0,
      profit_pc: 0,
      usd_amount: 0,
      total_value: 0,
    };
    portfolio_total.rebalanced_period_dca[rp] = {
      coin_value: 0,
      profit_pc: 0,
      usd_amount: 0,
      total_value: 0,
    };
  });
  rebalance_thresholds.forEach((rt) => {
    portfolio_total.rebalanced_threshold[rt] = {
      rebalanced_threshold_pc: {},
      coin_value: 0,
      profit_pc: 0,
      usd_amount: 0,
      total_value: 0,
    };
    portfolio_total.rebalanced_threshold_dca[rt] = {
      rebalanced_threshold_pc: {},
      coin_value: 0,
      profit_pc: 0,
      usd_amount: 0,
      total_value: 0,
    };
  });

  type Totals = {
    [coin: string]: {
      portfolio_index: number;
      initial_value: number;
      buy_and_hold: BuyAndHoldValues;
      dca: BuyAndHoldValues;
      rebalanced_period: RebalancePeriod;
      rebalanced_threshold: RebalanceThreshold;
      rebalanced_period_dca: RebalancePeriod;
      rebalanced_threshold_dca: RebalanceThreshold;
    };
  };

  let coin_totals: Totals = {};

  portfolio_coins.forEach((p: PortfolioCoin, index: number) => {
    const first_date = Object.keys(historical_data.prices)[0];
    let initial_price = historical_data.prices[first_date][p.coin];

    let amount = p.value / initial_price;

    initial_amounts[p.coin] = amount;

    coin_totals[p.coin] = {
      portfolio_index: index,
      initial_value: initial_price * amount,
      buy_and_hold: {
        amount: amount,
        value: initial_price * amount,
        profit_pc: 0,
      },
      dca: {
        amount: amount,
        value: initial_price * amount,
        profit_pc: 0,
      },
      rebalanced_period: {},
      rebalanced_threshold: {},
      rebalanced_period_dca: {},
      rebalanced_threshold_dca: {},
    };

    let coin_value = initial_price * amount;
    rebalance_periods.forEach((rp) => {
      coin_totals[p.coin].rebalanced_period[rp] = {
        amount: amount,
        coin_value: coin_value,
        profit_pc: 0,
        difference_pc: 0,
        usd_amount: 0,
        total_value: coin_value,
      };

      if (dca.amount > 0) {
        coin_totals[p.coin].rebalanced_period_dca[rp] = {
          amount: amount,
          coin_value: coin_value,
          profit_pc: 0,
          difference_pc: 0,
          usd_amount: 0,
          total_value: coin_value,
        };
      }
    });
    rebalance_thresholds.forEach((rt) => {
      coin_totals[p.coin].rebalanced_threshold[rt] = {
        amount: amount,
        coin_value: coin_value,
        profit_pc: 0,
        difference_pc: 0,
        usd_amount: 0,
        total_value: coin_value,
      };
      if (dca.amount > 0) {
        coin_totals[p.coin].rebalanced_threshold_dca[rt] = {
          amount: amount,
          coin_value: coin_value,
          profit_pc: 0,
          difference_pc: 0,
          usd_amount: 0,
          total_value: coin_value,
        };
      }
    });
    if (results) {
      results.coin[p.coin] = [];
    }
  });

  // calculate initial portfolio value
  const dates: string[] = Object.keys(historical_data.prices);
  const first_date = parseInt(dates[0]);
  const second_date = parseInt(dates[1]);

  for (const [coin, price] of Object.entries(
    historical_data.prices[first_date]
  )) {
    initial_value += price * initial_amounts[coin];
  }

  const rebalance_period = getRebalancePeriod(
    first_date,
    second_date,
    rebalanceHours
  );

  var time_period_count = 1;
  let d = 0;

  for (const [date, prices] of Object.entries(historical_data.prices)) {
    d = parseInt(date);
    // reset values
    portfolio_total = {
      buy_and_hold: {
        value: 0,
        profit_pc: 0,
      },
      dca: {
        value: 0,
        profit_pc: 0,
      },
      rebalanced_period: {},
      rebalanced_threshold: {},
      rebalanced_period_dca: {},
      rebalanced_threshold_dca: {},
    };
    portfolio_total.buy_and_hold.value = 0;
    portfolio_total.dca.value = 0;

    for (let i = 0; i < num_rebalance_periods; i++) {
      let rp = rebalance_periods[i];
      portfolio_total.rebalanced_period[rp] = {
        coin_value: 0,
        profit_pc: 0,
        usd_amount: 0,
        total_value: 0,
      };
      if (dca.amount > 0) {
        portfolio_total.rebalanced_period_dca[rp] = {
          coin_value: 0,
          profit_pc: 0,
          usd_amount: 0,
          total_value: 0,
        };
      }
    }
    for (let i = 0; i < num_rebalance_thresholds; i++) {
      let rt = rebalance_thresholds[i];
      portfolio_total.rebalanced_threshold[rt] = {
        rebalanced_threshold_pc: {},
        coin_value: 0,
        profit_pc: 0,
        usd_amount: 0,
        total_value: 0,
      };
      if (dca.amount > 0) {
        portfolio_total.rebalanced_threshold_dca[rt] = {
          rebalanced_threshold_pc: {},
          coin_value: 0,
          profit_pc: 0,
          usd_amount: 0,
          total_value: 0,
        };
      }
    }

    for (const [coin, price] of Object.entries(historical_data.prices[date])) {
      portfolio_total.buy_and_hold.value +=
        price * coin_totals[coin].buy_and_hold.amount;

      if (dca.amount > 0) {
        portfolio_total.dca.value += price * coin_totals[coin].dca.amount;
      }

      for (let i = 0; i < num_rebalance_periods; i++) {
        let rp = rebalance_periods[i];

        portfolio_total.rebalanced_period[rp].coin_value +=
          price * coin_totals[coin].rebalanced_period[rp].amount;
        portfolio_total.rebalanced_period[rp].total_value =
          portfolio_total.rebalanced_period[rp].coin_value +
          portfolio_total.rebalanced_period[rp].usd_amount;

        if (dca.amount > 0) {
          portfolio_total.rebalanced_period_dca[rp].coin_value +=
            price * coin_totals[coin].rebalanced_period_dca[rp].amount;
          portfolio_total.rebalanced_period_dca[rp].total_value =
            portfolio_total.rebalanced_period_dca[rp].coin_value +
            portfolio_total.rebalanced_period_dca[rp].usd_amount;
        }
      }
      for (let i = 0; i < num_rebalance_thresholds; i++) {
        let rt = rebalance_thresholds[i];

        portfolio_total.rebalanced_threshold[rt].coin_value +=
          price * coin_totals[coin].rebalanced_threshold[rt].amount;
        portfolio_total.rebalanced_threshold[rt].total_value =
          portfolio_total.rebalanced_threshold[rt].coin_value +
          portfolio_total.rebalanced_threshold[rt].usd_amount;

        if (dca.amount > 0) {
          portfolio_total.rebalanced_threshold_dca[rt].coin_value +=
            price * coin_totals[coin].rebalanced_threshold_dca[rt].amount;
          portfolio_total.rebalanced_threshold_dca[rt].total_value =
            portfolio_total.rebalanced_threshold_dca[rt].coin_value +
            portfolio_total.rebalanced_threshold_dca[rt].usd_amount;
        }
      }
    }

    portfolio_total.buy_and_hold.profit_pc = getProfitPercentage(
      initial_value,
      portfolio_total.buy_and_hold.value
    );

    if (dca.amount > 0) {
      portfolio_total.dca.profit_pc = getProfitPercentage(
        initial_value,
        portfolio_total.dca.value
      );
    }

    for (const [coin, price] of Object.entries(prices)) {
      coin_totals[coin].buy_and_hold.value =
        price * coin_totals[coin].buy_and_hold.amount;
      coin_totals[coin].buy_and_hold.profit_pc = getProfitPercentage(
        coin_totals[coin].initial_value,
        coin_totals[coin].buy_and_hold.value
      );

      if (dca.amount > 0) {
        coin_totals[coin].dca.value = price * coin_totals[coin].dca.amount;
        coin_totals[coin].dca.profit_pc = getProfitPercentage(
          coin_totals[coin].initial_value,
          coin_totals[coin].dca.value
        );
      }

      rebalance_periods.forEach((rp) => {
        coin_totals[coin].rebalanced_period[rp].coin_value =
          price * coin_totals[coin].rebalanced_period[rp].amount;
        coin_totals[coin].rebalanced_period[rp].total_value =
          coin_totals[coin].rebalanced_period[rp].coin_value +
          coin_totals[coin].rebalanced_period[rp].usd_amount;
        coin_totals[coin].rebalanced_period[rp].profit_pc = getProfitPercentage(
          coin_totals[coin].initial_value,
          coin_totals[coin].rebalanced_period[rp].total_value
        );

        if (dca.amount > 0) {
          coin_totals[coin].rebalanced_period_dca[rp].coin_value =
            price * coin_totals[coin].rebalanced_period_dca[rp].amount;
          coin_totals[coin].rebalanced_period_dca[rp].total_value =
            coin_totals[coin].rebalanced_period_dca[rp].coin_value +
            coin_totals[coin].rebalanced_period_dca[rp].usd_amount;
          coin_totals[coin].rebalanced_period_dca[rp].profit_pc =
            getProfitPercentage(
              coin_totals[coin].initial_value,
              coin_totals[coin].rebalanced_period_dca[rp].total_value
            );
        }
      });
      rebalance_thresholds.forEach((rt) => {
        coin_totals[coin].rebalanced_threshold[rt].coin_value =
          price * coin_totals[coin].rebalanced_threshold[rt].amount;
        coin_totals[coin].rebalanced_threshold[rt].total_value =
          coin_totals[coin].rebalanced_threshold[rt].coin_value +
          coin_totals[coin].rebalanced_threshold[rt].usd_amount;
        coin_totals[coin].rebalanced_threshold[rt].profit_pc =
          getProfitPercentage(
            coin_totals[coin].initial_value,
            coin_totals[coin].rebalanced_threshold[rt].total_value
          );

        if (dca.amount > 0) {
          coin_totals[coin].rebalanced_threshold_dca[rt].coin_value =
            price * coin_totals[coin].rebalanced_threshold_dca[rt].amount;
          coin_totals[coin].rebalanced_threshold_dca[rt].total_value =
            coin_totals[coin].rebalanced_threshold_dca[rt].coin_value +
            coin_totals[coin].rebalanced_threshold_dca[rt].usd_amount;
          coin_totals[coin].rebalanced_threshold_dca[rt].profit_pc =
            getProfitPercentage(
              coin_totals[coin].initial_value,
              coin_totals[coin].rebalanced_threshold_dca[rt].total_value
            );
        }
      });

      if (dca.amount > 0 && time_period_count % dca.period === 0) {
        const { dca_amount, dca_value } = getDcaValues(
          portfolio_coins[coin_totals[coin].portfolio_index],
          price,
          dca.amount
        );

        coin_totals[coin].dca.amount += dca_amount ?? 0;
        coin_totals[coin].dca.value += dca_value ?? 0;
      }

      for (let i = 0; i < num_rebalance_periods; i++) {
        let rp = rebalance_periods[i];

        if (dca.amount > 0 && time_period_count % dca.period === 0) {
          const { dca_amount, dca_value } = getDcaValues(
            portfolio_coins[coin_totals[coin].portfolio_index],
            price,
            dca.amount
          );

          coin_totals[coin].rebalanced_period_dca[rp].amount += dca_amount ?? 0;
          coin_totals[coin].rebalanced_period_dca[rp].coin_value +=
            dca_value ?? 0;
          portfolio_total.rebalanced_period_dca[rp].coin_value +=
            dca_value ?? 0;
        }

        const {
          to_balance_value,
          to_balance_amount,
          rebalanced_difference_percentage,
          target_value,
          target_amount,
          //reached_threshold,
        } = getBacktestRebalanceValues(
          portfolio_coins[coin_totals[coin].portfolio_index],
          price,
          coin_totals[coin].rebalanced_period[rp].amount,
          portfolio_total.rebalanced_period[rp].coin_value,
          0
        );
        coin_totals[coin].rebalanced_period[rp].difference_pc =
          rebalanced_difference_percentage;

        // check whether to rebalance
        if (/*time_period_count === 1 ||*/ time_period_count % rp === 0) {
          coin_totals[coin].rebalanced_period[rp].amount = target_amount;
          coin_totals[coin].rebalanced_period[rp].coin_value = target_value;
        }

        portfolio_total.rebalanced_period[rp].profit_pc = getProfitPercentage(
          initial_value,
          portfolio_total.rebalanced_period[rp].total_value
        );

        // DCA
        if (dca.amount > 0) {
          const {
            to_balance_value: dca_to_balance,
            to_balance_amount: dca_to_balance_amount,
            rebalanced_difference_percentage:
              dca_rebalanced_difference_percentage,
            target_value: dca_target_value,
            target_amount: dca_target_amount,
            //reached_threshold,
          } = getBacktestRebalanceValues(
            portfolio_coins[coin_totals[coin].portfolio_index],
            price,
            coin_totals[coin].rebalanced_period_dca[rp].amount,
            portfolio_total.rebalanced_period_dca[rp].coin_value,
            0
          );
          coin_totals[coin].rebalanced_period_dca[rp].difference_pc =
            dca_rebalanced_difference_percentage;

          if (/*time_period_count === 1 ||*/ time_period_count % rp === 0) {
            coin_totals[coin].rebalanced_period_dca[rp].amount =
              dca_target_amount;
            coin_totals[coin].rebalanced_period_dca[rp].coin_value =
              dca_target_value;
          }
          portfolio_total.rebalanced_period_dca[rp].profit_pc =
            getProfitPercentage(
              initial_value,
              portfolio_total.rebalanced_period_dca[rp].total_value
            );
        }
      }

      for (let i = 0; i < num_rebalance_thresholds; i++) {
        let rt = rebalance_thresholds[i];

        if (dca.amount > 0 && time_period_count % dca.period === 0) {
          const { dca_amount, dca_value } = getDcaValues(
            portfolio_coins[coin_totals[coin].portfolio_index],
            price,
            dca.amount
          );

          coin_totals[coin].rebalanced_threshold_dca[rt].amount +=
            dca_amount ?? 0;
          coin_totals[coin].rebalanced_threshold_dca[rt].coin_value +=
            dca_value ?? 0;
          portfolio_total.rebalanced_threshold_dca[rt].coin_value +=
            dca_value ?? 0;
        }

        const {
          //to_balance_value,
          //to_balance_amount,
          rebalanced_difference_percentage,
          reached_threshold,
          target_amount,
          target_value,
        } = getBacktestRebalanceValues(
          portfolio_coins[coin_totals[coin].portfolio_index],
          price,
          coin_totals[coin].rebalanced_threshold[rt].amount,
          portfolio_total.rebalanced_threshold[rt].coin_value,
          rt
        );

        coin_totals[coin].rebalanced_threshold[rt].difference_pc =
          rebalanced_difference_percentage;

        // check whether to rebalance
        if (/*time_period_count === 1 ||*/ reached_threshold) {
          coin_totals[coin].rebalanced_threshold[rt].amount = target_amount;
          coin_totals[coin].rebalanced_threshold[rt].coin_value = target_value;

          portfolio_total.rebalanced_threshold[rt].rebalanced_threshold_pc[
            coin
          ] = rebalanced_difference_percentage;
        }
        portfolio_total.rebalanced_threshold[rt].profit_pc =
          getProfitPercentage(
            initial_value,
            portfolio_total.rebalanced_threshold[rt].total_value
          );

        // DCA
        if (dca.amount > 0) {
          const {
            to_balance_value: dca_to_balance,
            to_balance_amount: dca_to_balance_amount,
            rebalanced_difference_percentage:
              dca_rebalanced_difference_percentage,
            reached_threshold: dca_reached_threshold,
            target_value: dca_target_value,
            target_amount: dca_target_amount,
          } = getBacktestRebalanceValues(
            portfolio_coins[coin_totals[coin].portfolio_index],
            price,
            coin_totals[coin].rebalanced_threshold_dca[rt].amount,
            portfolio_total.rebalanced_threshold_dca[rt].coin_value,
            rt
          );

          if (/*time_period_count === 1 ||*/ dca_reached_threshold) {
            coin_totals[coin].rebalanced_threshold_dca[rt].amount =
              dca_target_amount;
            coin_totals[coin].rebalanced_threshold_dca[rt].coin_value =
              dca_target_value;

            portfolio_total.rebalanced_threshold_dca[
              rt
            ].rebalanced_threshold_pc[coin] =
              dca_rebalanced_difference_percentage;
          }
          portfolio_total.rebalanced_threshold_dca[rt].profit_pc =
            getProfitPercentage(
              initial_value,
              portfolio_total.rebalanced_threshold_dca[rt].total_value
            );
        }
      }

      results.coin[coin].push({
        date: new Date(parseInt(date)),
        buy_and_hold: {
          amount: coin_totals[coin].buy_and_hold.amount,
          value: coin_totals[coin].buy_and_hold.value,
          profit_pc: coin_totals[coin].buy_and_hold.profit_pc,
        },
        dca: {
          amount: coin_totals[coin].dca.amount,
          value: coin_totals[coin].dca.value,
          profit_pc: coin_totals[coin].dca.profit_pc,
        },
        rebalanced_period: {},
        rebalanced_threshold: {},
        rebalanced_period_dca: {},
        rebalanced_threshold_dca: {},
      });

      let idx = results.coin[coin].length - 1;

      for (let i = 0; i < num_rebalance_periods; i++) {
        let rp = rebalance_periods[i];

        results.coin[coin][idx].rebalanced_period[rp] = {
          amount: coin_totals[coin].rebalanced_period[rp].amount,
          coin_value: coin_totals[coin].rebalanced_period[rp].coin_value,
          profit_pc: coin_totals[coin].rebalanced_period[rp].profit_pc,
          difference_pc: coin_totals[coin].rebalanced_period[rp].difference_pc,
          usd_amount: coin_totals[coin].rebalanced_period[rp].usd_amount,
          total_value: coin_totals[coin].rebalanced_period[rp].total_value,
        };

        if (dca.amount > 0) {
          results.coin[coin][idx].rebalanced_period_dca[rp] = {
            amount: coin_totals[coin].rebalanced_period_dca[rp].amount,
            coin_value: coin_totals[coin].rebalanced_period_dca[rp].coin_value,
            profit_pc: coin_totals[coin].rebalanced_period_dca[rp].profit_pc,
            difference_pc:
              coin_totals[coin].rebalanced_period_dca[rp].difference_pc,
            usd_amount: coin_totals[coin].rebalanced_period_dca[rp].usd_amount,
            total_value:
              coin_totals[coin].rebalanced_period_dca[rp].total_value,
          };
        }
      }
      for (let i = 0; i < num_rebalance_thresholds; i++) {
        let rt = rebalance_thresholds[i];

        results.coin[coin][idx].rebalanced_threshold[rt] = {
          amount: coin_totals[coin].rebalanced_threshold[rt].amount,
          coin_value: coin_totals[coin].rebalanced_threshold[rt].coin_value,
          profit_pc: coin_totals[coin].rebalanced_threshold[rt].profit_pc,
          difference_pc:
            coin_totals[coin].rebalanced_threshold[rt].difference_pc,
          usd_amount: coin_totals[coin].rebalanced_threshold[rt].usd_amount,
          total_value: coin_totals[coin].rebalanced_threshold[rt].total_value,
        };

        if (dca.amount > 0) {
          results.coin[coin][idx].rebalanced_threshold_dca[rt] = {
            amount: coin_totals[coin].rebalanced_threshold_dca[rt].amount,
            coin_value:
              coin_totals[coin].rebalanced_threshold_dca[rt].coin_value,
            profit_pc: coin_totals[coin].rebalanced_threshold_dca[rt].profit_pc,
            difference_pc:
              coin_totals[coin].rebalanced_threshold_dca[rt].difference_pc,
            usd_amount:
              coin_totals[coin].rebalanced_threshold_dca[rt].usd_amount,
            total_value:
              coin_totals[coin].rebalanced_threshold_dca[rt].total_value,
          };
        }
      }
    }

    // ------------------------------------------------------------------------

    if (dca.amount > 0 && time_period_count % dca.period === 0) {
      portfolio_total.dca.value += dca.amount;
    }

    results.portfolio.push({
      date: new Date(d),
      buy_and_hold: {
        value: portfolio_total.buy_and_hold.value,
        profit_pc: portfolio_total.buy_and_hold.profit_pc,
      },
      dca: {
        value: portfolio_total.dca.value,
        profit_pc: portfolio_total.dca.profit_pc,
      },
      rebalanced_period: {},
      rebalanced_threshold: {},
      rebalanced_period_dca: {},
      rebalanced_threshold_dca: {},
    });

    let idx = results.portfolio.length - 1;

    for (let i = 0; i < num_rebalance_periods; i++) {
      let rp = rebalance_periods[i];

      results.portfolio[idx].rebalanced_period[rp] = {
        coin_value: portfolio_total.rebalanced_period[rp].coin_value,
        profit_pc: portfolio_total.rebalanced_period[rp].profit_pc,
        usd_amount: portfolio_total.rebalanced_period[rp].usd_amount,
        total_value: portfolio_total.rebalanced_period[rp].total_value,
      };

      if (dca.amount > 0) {
        results.portfolio[idx].rebalanced_period_dca[rp] = {
          coin_value: portfolio_total.rebalanced_period_dca[rp].coin_value,
          profit_pc: portfolio_total.rebalanced_period_dca[rp].profit_pc,
          usd_amount: portfolio_total.rebalanced_period_dca[rp].usd_amount,
          total_value: portfolio_total.rebalanced_period_dca[rp].total_value,
        };
      }
    }

    for (let i = 0; i < num_rebalance_thresholds; i++) {
      let rt = rebalance_thresholds[i];

      results.portfolio[idx].rebalanced_threshold[rt] = {
        rebalanced_threshold_pc:
          portfolio_total.rebalanced_threshold[rt].rebalanced_threshold_pc,
        coin_value: portfolio_total.rebalanced_threshold[rt].coin_value,
        profit_pc: portfolio_total.rebalanced_threshold[rt].profit_pc,
        usd_amount: portfolio_total.rebalanced_threshold[rt].usd_amount,
        total_value: portfolio_total.rebalanced_threshold[rt].total_value,
      };

      if (dca.amount > 0) {
        results.portfolio[idx].rebalanced_threshold_dca[rt] = {
          rebalanced_threshold_pc:
            portfolio_total.rebalanced_threshold_dca[rt]
              .rebalanced_threshold_pc,
          coin_value: portfolio_total.rebalanced_threshold_dca[rt].coin_value,
          profit_pc: portfolio_total.rebalanced_threshold_dca[rt].profit_pc,
          usd_amount: portfolio_total.rebalanced_threshold_dca[rt].usd_amount,
          total_value: portfolio_total.rebalanced_threshold_dca[rt].total_value,
        };
      }
    }

    time_period_count++;
  }

  results.stats = backtest_stats(results, dca, rebalance);
  return results;
};

const backtest_stats = (
  results: BackTestResults,
  dca: BacktestDcaType,
  rebalance: BacktestRebalanceType
): BacktestStats => {
  const rebalance_periods = rebalance.periods; //[1, 7, 14];
  const rebalance_thresholds = rebalance.thresholds; //[1, 5, 10];

  const num_rebalance_periods = rebalance_periods.length;
  const num_rebalance_thresholds = rebalance_thresholds.length;

  const min_portfolio_buy_and_hold = results.portfolio.reduce(
    (prev: BacktestPortfolioResults, curr: BacktestPortfolioResults) =>
      prev.buy_and_hold.value < curr.buy_and_hold.value ? prev : curr
  );

  const max_portfolio_buy_and_hold = results.portfolio.reduce(
    (prev: BacktestPortfolioResults, curr: BacktestPortfolioResults) =>
      prev.buy_and_hold.value > curr.buy_and_hold.value ? prev : curr
  );

  const getPortfolioBuyAndHoldMinStats = (): BacktestStatsValues => {
    return {
      date: min_portfolio_buy_and_hold.date,
      value: min_portfolio_buy_and_hold.buy_and_hold.value,
      profit_pc: min_portfolio_buy_and_hold.buy_and_hold.profit_pc,
    };
  };

  const getPortfolioBuyAndHoldMaxStats = (): BacktestStatsValues => {
    return {
      date: max_portfolio_buy_and_hold.date,
      value: max_portfolio_buy_and_hold.buy_and_hold.value,
      profit_pc: max_portfolio_buy_and_hold.buy_and_hold.profit_pc,
    };
  };

  const min_portfolio_dca = results.portfolio.reduce(
    (prev: BacktestPortfolioResults, curr: BacktestPortfolioResults) =>
      prev.dca.value < curr.dca.value ? prev : curr
  );

  const max_portfolio_dca = results.portfolio.reduce(
    (prev: BacktestPortfolioResults, curr: BacktestPortfolioResults) =>
      prev.dca.value > curr.dca.value ? prev : curr
  );

  const getPortfolioDcaMinStats = (): BacktestStatsValues => {
    return {
      date: min_portfolio_dca.date,
      value: min_portfolio_dca.dca.value,
      profit_pc: min_portfolio_dca.dca.profit_pc,
    };
  };

  const getPortfolioDcaMaxStats = (): BacktestStatsValues => {
    return {
      date: max_portfolio_dca.date,
      value: max_portfolio_dca.dca.value,
      profit_pc: max_portfolio_dca.dca.profit_pc,
    };
  };

  const getPortfolioRebalancePeriodMinStats = (
    rp: number
  ): BacktestStatsValues => {
    return {
      date: min_portfolio_rebalanced_period[rp].date,
      value:
        min_portfolio_rebalanced_period[rp].rebalanced_period[rp].coin_value,
      profit_pc:
        min_portfolio_rebalanced_period[rp].rebalanced_period[rp].profit_pc,
    };
  };

  const getPortfolioRebalancePeriodMaxStats = (
    rp: number
  ): BacktestStatsValues => {
    return {
      date: max_portfolio_rebalanced_period[rp].date,
      value:
        max_portfolio_rebalanced_period[rp].rebalanced_period[rp].coin_value,
      profit_pc:
        max_portfolio_rebalanced_period[rp].rebalanced_period[rp].profit_pc,
    };
  };

  const getPortfolioRebalanceThresholdMinStats = (
    rt: number
  ): BacktestStatsValues => {
    return {
      date: min_portfolio_rebalanced_threshold[rt].date,
      value:
        min_portfolio_rebalanced_threshold[rt].rebalanced_threshold[rt]
          .coin_value,
      profit_pc:
        min_portfolio_rebalanced_threshold[rt].rebalanced_threshold[rt]
          .profit_pc,
    };
  };

  const getPortfolioRebalanceThresholdMaxStats = (
    rt: number
  ): BacktestStatsValues => {
    return {
      date: max_portfolio_rebalanced_threshold[rt].date,
      value:
        max_portfolio_rebalanced_threshold[rt].rebalanced_threshold[rt]
          .coin_value,
      profit_pc:
        max_portfolio_rebalanced_threshold[rt].rebalanced_threshold[rt]
          .profit_pc,
    };
  };

  const getPortfolioRebalancePeriodDcaMinStats = (
    rp: number
  ): BacktestStatsValues => {
    return {
      date: min_portfolio_rebalanced_period_dca[rp].date,
      value:
        min_portfolio_rebalanced_period_dca[rp].rebalanced_period_dca[rp]
          .coin_value,
      profit_pc:
        min_portfolio_rebalanced_period_dca[rp].rebalanced_period_dca[rp]
          .profit_pc,
    };
  };

  const getPortfolioRebalancePeriodDcaMaxStats = (
    rp: number
  ): BacktestStatsValues => {
    return {
      date: max_portfolio_rebalanced_period_dca[rp].date,
      value:
        max_portfolio_rebalanced_period_dca[rp].rebalanced_period_dca[rp]
          .coin_value,
      profit_pc:
        max_portfolio_rebalanced_period_dca[rp].rebalanced_period_dca[rp]
          .profit_pc,
    };
  };

  const getPortfolioRebalanceThresholdDcaMinStats = (
    rt: number
  ): BacktestStatsValues => {
    return {
      date: min_portfolio_rebalanced_threshold_dca[rt].date,
      value:
        min_portfolio_rebalanced_threshold_dca[rt].rebalanced_threshold_dca[rt]
          .coin_value,
      profit_pc:
        min_portfolio_rebalanced_threshold_dca[rt].rebalanced_threshold_dca[rt]
          .profit_pc,
    };
  };

  const getPortfolioRebalanceThresholdDcaMaxStats = (
    rt: number
  ): BacktestStatsValues => {
    return {
      date: max_portfolio_rebalanced_threshold_dca[rt].date,
      value:
        max_portfolio_rebalanced_threshold_dca[rt].rebalanced_threshold_dca[rt]
          .coin_value,
      profit_pc:
        max_portfolio_rebalanced_threshold_dca[rt].rebalanced_threshold_dca[rt]
          .profit_pc,
    };
  };

  type BacktestPortfoliioStatsRebalanceValues = {
    [period: number]: BacktestPortfolioResults;
  };

  type BacktestCoinStatsRebalanceValues = {
    [period: number]: BacktestCoinResult;
  };

  let min_portfolio_rebalanced_period: BacktestPortfoliioStatsRebalanceValues =
    {};
  let max_portfolio_rebalanced_period: BacktestPortfoliioStatsRebalanceValues =
    {};
  let min_portfolio_rebalanced_period_dca: BacktestPortfoliioStatsRebalanceValues =
    {};
  let max_portfolio_rebalanced_period_dca: BacktestPortfoliioStatsRebalanceValues =
    {};

  let min_portfolio_rebalanced_threshold: BacktestPortfoliioStatsRebalanceValues =
    {};
  let max_portfolio_rebalanced_threshold: BacktestPortfoliioStatsRebalanceValues =
    {};
  let min_portfolio_rebalanced_threshold_dca: BacktestPortfoliioStatsRebalanceValues =
    {};
  let max_portfolio_rebalanced_threshold_dca: BacktestPortfoliioStatsRebalanceValues =
    {};

  for (let i = 0; i < num_rebalance_periods; i++) {
    let rp = rebalance_periods[i];

    min_portfolio_rebalanced_period[rp] = results.portfolio.reduce(
      (prev: BacktestPortfolioResults, curr: BacktestPortfolioResults) =>
        prev.rebalanced_period[rp].coin_value <
        curr.rebalanced_period[rp].coin_value
          ? prev
          : curr
    );

    max_portfolio_rebalanced_period[rp] = results.portfolio.reduce(
      (prev: BacktestPortfolioResults, curr: BacktestPortfolioResults) =>
        prev.rebalanced_period[rp].coin_value >
        curr.rebalanced_period[rp].coin_value
          ? prev
          : curr
    );

    if (dca.amount > 0) {
      min_portfolio_rebalanced_period_dca[rp] = results.portfolio.reduce(
        (prev: BacktestPortfolioResults, curr: BacktestPortfolioResults) =>
          prev.rebalanced_period_dca[rp].coin_value <
          curr.rebalanced_period_dca[rp].coin_value
            ? prev
            : curr
      );

      max_portfolio_rebalanced_period_dca[rp] = results.portfolio.reduce(
        (prev: BacktestPortfolioResults, curr: BacktestPortfolioResults) =>
          prev.rebalanced_period_dca[rp].coin_value >
          curr.rebalanced_period_dca[rp].coin_value
            ? prev
            : curr
      );
    }
  }

  for (let i = 0; i < num_rebalance_thresholds; i++) {
    let rt = rebalance_thresholds[i];

    min_portfolio_rebalanced_threshold[rt] = results.portfolio.reduce(
      (prev: BacktestPortfolioResults, curr: BacktestPortfolioResults) =>
        prev.rebalanced_threshold[rt].coin_value <
        curr.rebalanced_threshold[rt].coin_value
          ? prev
          : curr
    );

    max_portfolio_rebalanced_threshold[rt] = results.portfolio.reduce(
      (prev: BacktestPortfolioResults, curr: BacktestPortfolioResults) =>
        prev.rebalanced_threshold[rt].coin_value >
        curr.rebalanced_threshold[rt].coin_value
          ? prev
          : curr
    );

    if (dca.amount > 0) {
      min_portfolio_rebalanced_threshold_dca[rt] = results.portfolio.reduce(
        (prev: BacktestPortfolioResults, curr: BacktestPortfolioResults) =>
          prev.rebalanced_threshold_dca[rt].coin_value <
          curr.rebalanced_threshold_dca[rt].coin_value
            ? prev
            : curr
      );

      max_portfolio_rebalanced_threshold_dca[rt] = results.portfolio.reduce(
        (prev: BacktestPortfolioResults, curr: BacktestPortfolioResults) =>
          prev.rebalanced_threshold_dca[rt].coin_value >
          curr.rebalanced_threshold_dca[rt].coin_value
            ? prev
            : curr
      );
    }
  }

  const stats: BacktestStats = {
    portfolio: {
      buy_and_hold: {
        min: getPortfolioBuyAndHoldMinStats(),
        max: getPortfolioBuyAndHoldMaxStats(),
      },
      dca: {
        min: getPortfolioDcaMinStats(),
        max: getPortfolioDcaMaxStats(),
      },
      rebalanced_period: {},
      rebalanced_threshold: {},
      rebalanced_period_dca: {},
      rebalanced_threshold_dca: {},
    },
    coin: {},
  };

  let min_coin_rebalanced_period: BacktestCoinStatsRebalanceValues = {};
  let max_coin_rebalanced_period: BacktestCoinStatsRebalanceValues = {};
  let min_coin_rebalanced_period_dca: BacktestCoinStatsRebalanceValues = {};
  let max_coin_rebalanced_period_dca: BacktestCoinStatsRebalanceValues = {};

  let min_coin_rebalanced_threshold: BacktestCoinStatsRebalanceValues = {};
  let max_coin_rebalanced_threshold: BacktestCoinStatsRebalanceValues = {};
  let min_coin_rebalanced_threshold_dca: BacktestCoinStatsRebalanceValues = {};
  let max_coin_rebalanced_threshold_dca: BacktestCoinStatsRebalanceValues = {};

  const getCoinRebalancePeriodMinStats = (rp: number): BacktestStatsValues => {
    return {
      date: min_coin_rebalanced_period[rp].date,
      value: min_coin_rebalanced_period[rp].rebalanced_period[rp].coin_value,
      profit_pc: min_coin_rebalanced_period[rp].rebalanced_period[rp].profit_pc,
    };
  };

  const getCoinRebalancePeriodMaxStats = (rp: number): BacktestStatsValues => {
    return {
      date: max_coin_rebalanced_period[rp].date,
      value: max_coin_rebalanced_period[rp].rebalanced_period[rp].coin_value,
      profit_pc: max_coin_rebalanced_period[rp].rebalanced_period[rp].profit_pc,
    };
  };

  const getCoinRebalanceThresholdMinStats = (
    rt: number
  ): BacktestStatsValues => {
    return {
      date: min_coin_rebalanced_threshold[rt].date,
      value:
        min_coin_rebalanced_threshold[rt].rebalanced_threshold[rt].coin_value,
      profit_pc:
        min_coin_rebalanced_threshold[rt].rebalanced_threshold[rt].profit_pc,
    };
  };

  const getCoinRebalanceThresholdMaxStats = (
    rt: number
  ): BacktestStatsValues => {
    return {
      date: max_coin_rebalanced_threshold[rt].date,
      value:
        max_coin_rebalanced_threshold[rt].rebalanced_threshold[rt].coin_value,
      profit_pc:
        max_coin_rebalanced_threshold[rt].rebalanced_threshold[rt].profit_pc,
    };
  };

  const getCoinRebalancePeriodDcaMinStats = (
    rp: number
  ): BacktestStatsValues => {
    return {
      date: min_coin_rebalanced_period_dca[rp].date,
      value:
        min_coin_rebalanced_period_dca[rp].rebalanced_period[rp].coin_value,
      profit_pc:
        min_coin_rebalanced_period_dca[rp].rebalanced_period[rp].profit_pc,
    };
  };

  const getCoinRebalancePeriodDcaMaxStats = (
    rp: number
  ): BacktestStatsValues => {
    return {
      date: max_coin_rebalanced_period_dca[rp].date,
      value:
        max_coin_rebalanced_period_dca[rp].rebalanced_period[rp].coin_value,
      profit_pc:
        max_coin_rebalanced_period_dca[rp].rebalanced_period[rp].profit_pc,
    };
  };

  const getCoinRebalanceThresholdDcaMinStats = (
    rt: number
  ): BacktestStatsValues => {
    return {
      date: min_coin_rebalanced_threshold_dca[rt].date,
      value:
        min_coin_rebalanced_threshold_dca[rt].rebalanced_threshold[rt]
          .coin_value,
      profit_pc:
        min_coin_rebalanced_threshold_dca[rt].rebalanced_threshold[rt]
          .profit_pc,
    };
  };

  const getCoinRebalanceThresholdDcaMaxStats = (
    rt: number
  ): BacktestStatsValues => {
    return {
      date: max_coin_rebalanced_threshold_dca[rt].date,
      value:
        max_coin_rebalanced_threshold_dca[rt].rebalanced_threshold[rt]
          .coin_value,
      profit_pc:
        max_coin_rebalanced_threshold_dca[rt].rebalanced_threshold[rt]
          .profit_pc,
    };
  };

  for (let i = 0; i < num_rebalance_periods; i++) {
    let rp = rebalance_periods[i];
    stats.portfolio.rebalanced_period[rp] = {
      min: getPortfolioRebalancePeriodMinStats(rp),
      max: getPortfolioRebalancePeriodMaxStats(rp),
    };

    if (dca.amount > 0) {
      stats.portfolio.rebalanced_period_dca[rp] = {
        min: getPortfolioRebalancePeriodDcaMinStats(rp),
        max: getPortfolioRebalancePeriodDcaMaxStats(rp),
      };
    }
  }

  for (let i = 0; i < num_rebalance_thresholds; i++) {
    let rt = rebalance_thresholds[i];
    stats.portfolio.rebalanced_threshold[rt] = {
      min: getPortfolioRebalanceThresholdMinStats(rt),
      max: getPortfolioRebalanceThresholdMaxStats(rt),
    };

    if (dca.amount > 0) {
      stats.portfolio.rebalanced_threshold_dca[rt] = {
        min: getPortfolioRebalanceThresholdDcaMinStats(rt),
        max: getPortfolioRebalanceThresholdDcaMaxStats(rt),
      };
    }
  }

  const coins = Object.keys(results.coin);

  coins.forEach((coin) => {
    const min_coin_buy_and_hold = results.coin[coin].reduce(
      (prev: BacktestCoinResult, curr: BacktestCoinResult) =>
        prev.buy_and_hold.value < curr.buy_and_hold.value ? prev : curr
    );
    const max_coin_buy_and_hold = results.coin[coin].reduce(
      (prev: BacktestCoinResult, curr: BacktestCoinResult) =>
        prev.buy_and_hold.value > curr.buy_and_hold.value ? prev : curr
    );

    const getCoinBuyAndHoldMinStats = (): BacktestStatsValues => {
      return {
        date: min_coin_buy_and_hold.date,
        value: min_coin_buy_and_hold.buy_and_hold.value,
        profit_pc: min_coin_buy_and_hold.buy_and_hold.profit_pc,
      };
    };

    const getCoinBuyAndHoldMaxStats = (): BacktestStatsValues => {
      return {
        date: max_coin_buy_and_hold.date,
        value: max_coin_buy_and_hold.buy_and_hold.value,
        profit_pc: max_coin_buy_and_hold.buy_and_hold.profit_pc,
      };
    };

    let min_coin_dca = results.coin[coin].reduce(
      (prev: BacktestCoinResult, curr: BacktestCoinResult) =>
        prev.dca.value < curr.dca.value ? prev : curr
    );
    let max_coin_dca = results.coin[coin].reduce(
      (prev: BacktestCoinResult, curr: BacktestCoinResult) =>
        prev.dca.value > curr.dca.value ? prev : curr
    );

    const getCoinDcaMinStats = (): BacktestStatsValues => {
      return {
        date: min_coin_dca.date,
        value: min_coin_dca.dca.value,
        profit_pc: min_coin_dca.dca.profit_pc,
      };
    };

    const getCoinDcaMaxStats = (): BacktestStatsValues => {
      return {
        date: max_coin_dca.date,
        value: max_coin_dca.dca.value,
        profit_pc: max_coin_dca.dca.profit_pc,
      };
    };

    stats.coin[coin] = {
      buy_and_hold: {
        min: getCoinBuyAndHoldMinStats(),
        max: getCoinBuyAndHoldMaxStats(),
      },
      dca: {
        min: getCoinDcaMinStats(),
        max: getCoinDcaMaxStats(),
      },
      rebalanced_period: {},
      rebalanced_threshold: {},
      rebalanced_period_dca: {},
      rebalanced_threshold_dca: {},
    };

    for (let i = 0; i < num_rebalance_periods; i++) {
      let rp = rebalance_periods[i];

      min_coin_rebalanced_period[rp] = results.coin[coin].reduce(
        (prev: BacktestCoinResult, curr: BacktestCoinResult) =>
          prev.rebalanced_period[rp].coin_value <
          curr.rebalanced_period[rp].coin_value
            ? prev
            : curr
      );

      max_coin_rebalanced_period[rp] = results.coin[coin].reduce(
        (prev: BacktestCoinResult, curr: BacktestCoinResult) =>
          prev.rebalanced_period[rp].coin_value >
          curr.rebalanced_period[rp].coin_value
            ? prev
            : curr
      );

      if (dca.amount > 0) {
        min_coin_rebalanced_period_dca[rp] = results.coin[coin].reduce(
          (prev: BacktestCoinResult, curr: BacktestCoinResult) =>
            prev.rebalanced_period_dca[rp].coin_value <
            curr.rebalanced_period_dca[rp].coin_value
              ? prev
              : curr
        );

        max_coin_rebalanced_period_dca[rp] = results.coin[coin].reduce(
          (prev: BacktestCoinResult, curr: BacktestCoinResult) =>
            prev.rebalanced_period_dca[rp].coin_value >
            curr.rebalanced_period_dca[rp].coin_value
              ? prev
              : curr
        );
      }
    }

    for (let i = 0; i < num_rebalance_thresholds; i++) {
      let rt = rebalance_thresholds[i];

      min_coin_rebalanced_threshold[rt] = results.coin[coin].reduce(
        (prev: BacktestCoinResult, curr: BacktestCoinResult) =>
          prev.rebalanced_threshold[rt].coin_value <
          curr.rebalanced_threshold[rt].coin_value
            ? prev
            : curr
      );

      max_coin_rebalanced_threshold[rt] = results.coin[coin].reduce(
        (prev: BacktestCoinResult, curr: BacktestCoinResult) =>
          prev.rebalanced_threshold[rt].coin_value >
          curr.rebalanced_threshold[rt].coin_value
            ? prev
            : curr
      );

      if (dca.amount > 0) {
        min_coin_rebalanced_threshold_dca[rt] = results.coin[coin].reduce(
          (prev: BacktestCoinResult, curr: BacktestCoinResult) =>
            prev.rebalanced_threshold_dca[rt].coin_value <
            curr.rebalanced_threshold_dca[rt].coin_value
              ? prev
              : curr
        );

        max_coin_rebalanced_threshold_dca[rt] = results.coin[coin].reduce(
          (prev: BacktestCoinResult, curr: BacktestCoinResult) =>
            prev.rebalanced_threshold_dca[rt].coin_value >
            curr.rebalanced_threshold_dca[rt].coin_value
              ? prev
              : curr
        );
      }
    }

    for (let i = 0; i < num_rebalance_periods; i++) {
      let rp = rebalance_periods[i];
      stats.coin[coin].rebalanced_period[rp] = {
        min: getCoinRebalancePeriodMinStats(rp),
        max: getCoinRebalancePeriodMaxStats(rp),
      };

      if (dca.amount > 0) {
        stats.coin[coin].rebalanced_period_dca[rp] = {
          min: getCoinRebalancePeriodDcaMinStats(rp),
          max: getCoinRebalancePeriodDcaMaxStats(rp),
        };
      }
    }

    for (let i = 0; i < num_rebalance_thresholds; i++) {
      let rt = rebalance_thresholds[i];
      stats.coin[coin].rebalanced_threshold[rt] = {
        min: getCoinRebalanceThresholdMinStats(rt),
        max: getCoinRebalanceThresholdMaxStats(rt),
      };

      if (dca.amount > 0) {
        stats.coin[coin].rebalanced_threshold_dca[rt] = {
          min: getCoinRebalanceThresholdDcaMinStats(rt),
          max: getCoinRebalanceThresholdDcaMaxStats(rt),
        };
      }
    }
  });

  return stats;
};
