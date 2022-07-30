import scriptOrder from '$/components/injected-scripts/scriptOrder.js';
import type {
    OrderResultError,
    OrderResultOk,
    ResultInjectOrder,
} from '$/components/injected-scripts/types.js';
import type { Order, TradeMessage } from '$/components/logic/types.js';
import { Process } from '$/components/logic/types.js';
import type { Quote, Tab } from '$/store.js';
import { runningTabs, subscribedQuotes } from '$/store.js';

const TOKEN = import.meta.env.VITE_TOKEN_API;
const SOCKET_FINNHUB_URL = 'wss://ws.finnhub.io?token=';
let socket = new WebSocket(SOCKET_FINNHUB_URL + TOKEN);
let isBusy = false;

const updateQuotes = ({ data }: { data: string }) => {
    const tradeMessage = JSON.parse(data) as TradeMessage;

    if (tradeMessage && tradeMessage.type === 'trade' && tradeMessage.data) {
        const quotes = tradeMessage.data;

        for (const { c, p, s: symbol, t } of quotes) {
            const tradeCondition = c.some((element: string) => {
                const ids = [
                    1, 2, 3, 4, 6, 7, 8, 13, 14, 19, 23, 28, 29, 33, 35,
                ];

                for (const id of ids) {
                    if (Number(element) === id) return true;
                }
            });

            if (tradeCondition) {
                const timeQuoteData = new Date(t);

                timeQuoteData.setSeconds(0);
                timeQuoteData.setMilliseconds(0);
                const currentTime = Number(timeQuoteData);

                if (!subscribedQuotes[symbol][currentTime]) {
                    subscribedQuotes[symbol][currentTime] = {
                        o: p,
                        h: p,
                        l: p,
                        c: p,
                        pdpm: 0,
                    };
                }
                if (!subscribedQuotes[symbol][currentTime].o) {
                    subscribedQuotes[symbol][currentTime].o = p;
                    subscribedQuotes[symbol][currentTime].o = p;
                }
                if (p > subscribedQuotes[symbol][currentTime].h) {
                    subscribedQuotes[symbol][currentTime].h = p;
                }
                if (p < subscribedQuotes[symbol][currentTime].l) {
                    subscribedQuotes[symbol][currentTime].l = p;
                }
                subscribedQuotes[symbol][currentTime].c = p;

                const timeQuotes = Object.keys(subscribedQuotes[symbol]);

                if (timeQuotes.length >= 3) {
                    const currentQuote = subscribedQuotes[symbol][currentTime];
                    const previousMinute =
                        subscribedQuotes[symbol][currentTime - 60000];
                    subscribedQuotes[symbol][currentTime].pdpm = diffPercent(
                        currentQuote.c,
                        previousMinute.c,
                    );
                }
                // console.log('msg',  tradeMessage, symbol)
            }
        }
    }
};
export const addEventWebsocketListener = () => {
    socket.addEventListener('message', updateQuotes);
};
const wait = (timeout: number) =>
    new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
const diffPercent = (a: number, b: number) =>
    a < b ? Number(`-${((b - a) * 100) / a}`) : Number(((a - b) * 100) / b);
const getCurrentTab = async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
};
const focusRobinhoodTab = async (tabId: number) => {
    let focusedTab: chrome.tabs.Tab;

    focusedTab = await getCurrentTab();

    if (focusedTab.id !== tabId) {
        console.warn('Tab out of focus, trying to focus the tab...');
        do {
            await chrome.tabs.update(tabId, { active: true });
            focusedTab = await getCurrentTab();
        } while (runningTabs[tabId] && focusedTab.id !== tabId);
    }

    return focusedTab.url && focusedTab.url.includes('robinhood.com/stocks');
};
const orderIsOk = (value: unknown): value is OrderResultOk =>
    typeof value === 'object' && value !== null && 'data' in value;
const orderIsError = (value: unknown): value is OrderResultError =>
    typeof value === 'object' && value !== null && 'error' in value;
const executeScript = async (tab: Tab, order: Order) => {
    const [{ result }] = await chrome.scripting.executeScript({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        injectImmediately: true,
        target: { tabId: tab.tabId, allFrames: true },
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        func: scriptOrder,
        args: [order.process, tab.typeOrder, order.orderQuantity, order.price],
    });

    if (orderIsOk(result) || orderIsError(result)) {
        return result;
    }
    return { error: 'Unknown error' };
};
const executeOrderDevelopment = (tab: Tab, order: Order) => {
    const result: ResultInjectOrder = {
        data: [
            {
                process: order.process,
                typeOrder: tab.typeOrder,
                shares: order.orderQuantity,
                avgSharePrice: order.price * Math.abs(order.orderQuantity),
                balance: order.price,
            },
        ],
    };
    return result;
};
export const orderConditions = async (tab: Tab, order: Order) => {
    if (await focusRobinhoodTab(tab.tabId)) {
        if (tab.dev && order.process === 'prefill') {
            return { data: [] };
        }
        if (tab.dev && (order.process === 'buy' || order.process === 'sell')) {
            return executeOrderDevelopment(tab, order);
        }
        return executeScript(tab, order);
    }
    return { error: 'Tab out of focus' };
};
const getQuoteFromQuotes = (time: number, symbol: string) => {
    const timeQuotes: Array<string> = Object.keys(subscribedQuotes[symbol]);
    console.log('Length data quotes:', timeQuotes.length);
    const timeQuote = Number(timeQuotes[timeQuotes.length - time + 1]);
    // console.log(timeQuote)
    // console.log(quotes[symbol][timeQuote])
    return subscribedQuotes[symbol][timeQuote];
};
const avgPrice = (quote: Quote) => (quote.h + quote.l) / 2;
const strategy = (tab: Tab, orderQuantity: number) => {
    const currentQuote = getQuoteFromQuotes(0, tab.symbol);
    const quoteOneMinuteAgo = getQuoteFromQuotes(1, tab.symbol);
    const quoteTwoMinuteAgo = getQuoteFromQuotes(2, tab.symbol);
    const currentAvgPrice = avgPrice(currentQuote);
    const avgPriceOneMinuteAgo = avgPrice(quoteOneMinuteAgo);

    if (orderQuantity > 0) {
        // if (pdpm >= condition.buy.pdpm) {
        //     return 'buy'
        // }
        if (
            (tab.mode === 'full 1' &&
                quoteTwoMinuteAgo.c > quoteOneMinuteAgo.c &&
                currentAvgPrice >= quoteOneMinuteAgo.h) ||
            (tab.mode === 'full 2' &&
                quoteTwoMinuteAgo.c > quoteOneMinuteAgo.c &&
                currentQuote.c >= quoteOneMinuteAgo.c)
        ) {
            console.info(
                'The buying strategy is confirmed:',
                quoteTwoMinuteAgo,
                quoteOneMinuteAgo,
                currentQuote,
            );
            return {
                process: Process.Buy,
                price: currentQuote.c,
                orderQuantity,
            };
        }
        return false;
    }
    if (orderQuantity < 0) {
        // if (pdpm <= condition.sell.pdpm) {
        //     return 'sell'
        // }
        if (
            (tab.mode === 'full 1' && currentAvgPrice < avgPriceOneMinuteAgo) ||
            (tab.mode === 'full 2' && currentQuote.c < quoteTwoMinuteAgo.c)
        ) {
            console.info(
                'The sale strategy is confirmed:',
                currentQuote,
                avgPriceOneMinuteAgo,
            );
            return {
                process: Process.Sell,
                price: currentQuote.c,
                orderQuantity,
            };
        }
        return false;
    }
};
const applyStrategy = async (tab: Tab, strategyResult: Order) => {
    const orderResult = await orderConditions(tab, {
        process: strategyResult.process,
        orderQuantity: strategyResult.orderQuantity,
        price: strategyResult.price,
    });
    if (orderIsOk(orderResult)) {
        runningTabs[tab.tabId].orderQuantity =
            orderResult.data[0].process === Process.Buy
                ? -tab.orderQuantity
                : tab.orderQuantity;
        return orderResult.data[0];
    }
    return false;
};
const unsubscribeSymbol = (symbol: string) => {
    socket.send(JSON.stringify({ type: 'unsubscribe', symbol }));
};
const changeIconExtension = async (text: string, color: string) => {
    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color });
};
export const stop = async (tab: Tab) => {
    if (runningTabs[tab.tabId]) {
        unsubscribeSymbol(tab.symbol);
        clearTimeout(runningTabs[tab.tabId].intervalIdCheckStrategy);
        await changeIconExtension('OFF', 'gray');
        delete runningTabs[tab.tabId];
        console.info('Stop automation', runningTabs);
    }
    return true;
};
const intervalCheckStrategy = async (tab: Tab, timeout: number) => {
    if (!isBusy && runningTabs[tab.tabId]) {
        isBusy = true;
        const { orderQuantity } = runningTabs[tab.tabId];
        const prefillResult = await orderConditions(tab, {
            process: Process.Prefill,
            orderQuantity,
            price: 0,
        });
        if (orderIsOk(prefillResult)) {
            const strategyResult = strategy(tab, orderQuantity);
            if (strategyResult) {
                const applyStrategyResult = await applyStrategy(
                    tab,
                    strategyResult,
                );
                if (orderIsOk(applyStrategyResult)) {
                    runningTabs[tab.tabId].history.push(applyStrategyResult);
                }
                await wait(1000);
            }
            await intervalCheckStrategy(tab, timeout);
        }
    }
    await stop(tab);
};
const setIntervalCheckStrategy = (tab: Tab, timeout: number) =>
    runningTabs[tab.tabId] && intervalCheckStrategy(tab, timeout);
const subscribeSymbol = (symbol: string) => {
    socket.send(JSON.stringify({ type: 'subscribe', symbol }));
};
export const reconnectWebSocket = async () => {
    if (socket.readyState === 3) {
        console.info('Websocket disconnected');
        socket.close();
        socket = new WebSocket(SOCKET_FINNHUB_URL + TOKEN);
        while (socket.readyState !== 1) {
            await wait(300);
        }
        console.info('Websocket reconnected');
        addEventWebsocketListener();

        for (const [key] of Object.entries(subscribedQuotes)) {
            subscribeSymbol(key);
        }
    }
    await wait(1000);
    await reconnectWebSocket();
};
const checkArgsForStart = (tab: Tab) => {
    console.log(tab);
    return (
        tab.tabId &&
        tab.symbol &&
        tab.mode &&
        tab.typeOrder &&
        tab.orderQuantity &&
        tab.condition
    );
};
export const start = async (tab: Tab) => {
    let timeQuotes: Array<string>;
    const argsIsChecked = checkArgsForStart(tab);

    console.log('Automation begin starting');
    if (argsIsChecked) {
        runningTabs[tab.tabId] = Object.assign({ history: [] }, tab);
        subscribedQuotes[tab.symbol] = {};

        changeIconExtension('ON', 'green');
        subscribeSymbol(tab.symbol);
        do {
            await wait(1000);
            timeQuotes = Object.keys(subscribedQuotes[tab.symbol]);
            console.log('Attempt check quotes data');
        } while (runningTabs[tab.tabId] && timeQuotes.length < 3);

        const intervalCheckStrategy = setIntervalCheckStrategy(tab, 2000);
        if (intervalCheckStrategy) {
            console.log('Automation started');
            return true;
        } else {
            console.log('Automation stopped, Interval not started');
            stop(tab);
        }
    } else {
        console.log('Automation begin starting cancel', 'args not checked');
        return;
    }
};
