export type OrderResult = {
  process: string;
  balance: number;
  shares: number;
  avgSharePrice: number;
  typeOrder: string;
};
export type OrderResultError = {
  error: string;
};
export type OrderResultOk = {
  data: Array<OrderResult>;
};
export type ResultInjectOrder = OrderResultError | OrderResultOk;
