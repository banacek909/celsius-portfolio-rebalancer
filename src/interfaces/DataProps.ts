export interface DataProps {
  date: string;
  price?: number;
  buy_and_hold: {};
  rebalanced_period: {};
  rebalanced_threshold: {};
}

export interface ChartDataProps {
  date: Date;
  price: number;
}
