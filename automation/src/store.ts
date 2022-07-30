import type { OrderResult } from '$/components/injected-scripts/types.js';

export type Tab = {
    symbol: string;
    tabId: number;
    condition: object;
    orderQuantity: number;
    typeOrder: string;
    mode: string;
    history: Array<OrderResult>;
    intervalIdCheckStrategy: number;
    dev: boolean;
};
export type Tabs = {
    [tabId: string]: Tab;
};
export type Quote = {
    o: number;
    h: number;
    l: number;
    c: number;
    pdpm: number;
};
export type StockSymbol = {
    [quoteTime: number]: Quote;
};
export type Quotes = {
    [symbolName: string]: StockSymbol;
};
export const runningTabs: Tabs = {};
export const subscribedQuotes: Quotes = {};
