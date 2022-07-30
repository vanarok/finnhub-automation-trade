import {
  addEventWebsocketListener,
  orderConditions,
  reconnectWebSocket,
  start,
  stop,
} from '$/components/logic/logic.js';
import type { StockSymbol, Tab } from '$/store.js';
import { runningTabs, subscribedQuotes } from '$/store.js';

const setInactiveIcon = async () => {
  const setBadgeText =
    (await chrome.action.setBadgeText({ text: 'OFF' })) | true;
  const setBadgeBackgroundColor = await chrome.action.setBadgeBackgroundColor({
    color: 'gray',
  });
  return setBadgeText && setBadgeBackgroundColor;
};
setInactiveIcon();
chrome.runtime.onMessage.addListener(
  async (
    { logic, getStatus, setStatus, testSell, testBuy, testPrefill },
    sender,
    sendResponse,
  ) => {
    if (logic) {
      sendResponse({ logic: true });
      return;
    }
    if (testPrefill) {
      console.log('testPrefill:', testPrefill);
      await orderConditions(
        testPrefill,
        'prefill',
        testPrefill.orderQuantity,
        10,
      );
      sendResponse({ success: true });
      return;
    }
    if (testSell) {
      console.log('testSell:', testSell);
      await orderConditions(testSell, 'sell', testSell.orderQuantity, 10);
      sendResponse({ success: true });
      return;
    }
    if (testBuy) {
      console.log('testBuy:', testBuy);
      await orderConditions(testBuy, 'buy', testBuy.orderQuantity, 10);
      sendResponse({ success: true });
      return;
    }
    if (getStatus) {
      // console.log('getStatus:', getStatus)
      const tab: Tab = runningTabs[getStatus.tabId];
      const quotesSymbol: StockSymbol =
        subscribedQuotes[getStatus.symbol] || {};
      let response: object;
      response = tab
        ? { status: { tab, quotes: quotesSymbol } }
        : { status: false };
      sendResponse(response);
      return;
    }
    if (setStatus && setStatus.running) {
      console.log('setStatus:', setStatus);
      const result = await start(setStatus);
      const response = { status: result };
      sendResponse(response);
      return;
    }
    if (setStatus && !setStatus.running) {
      console.log('setStatus:', setStatus);
      const result = stop(setStatus);
      const response = { status: result };
      sendResponse(response);
      return;
    }
    sendResponse({ ping: true });
  },
);

console.log('Logic ready');
setInactiveIcon();
void reconnectWebSocket();
addEventWebsocketListener();
