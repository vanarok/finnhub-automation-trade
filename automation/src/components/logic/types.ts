export enum Process {
  Prefill = 'prefill',
  Buy = 'buy',
  Sell = 'sell',
}

export type Strategy = {
  process: string;
  price: number;
};
export type TradeData = {
  p: number;
  s: string;
  t: number;
  v: number;
  c: Array<string>;
};
export type TradeMessage = {
  data: Array<TradeData>;
  type: string;
};
export type Order = {
  process: Process;
  orderQuantity: number;
  price: number;
};
