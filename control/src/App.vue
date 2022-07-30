<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

const { sendMessage } = chrome.runtime;
const lockSendStatus = ref(true);
const typesOrder = ref(['market']);
const modes = ref(['full 1', 'full 2']);
let form = reactive({
  running: false,
  tabId: 0,
  symbol: 'loading...',
  orderQuantity: 2,
  typeOrder: 'market',
  mode: 'full 2',
  dev: false,
  condition: {
    buy: { pdpm: 50 },
    sell: { pdpm: 50 },
  },
  history: [],
});
let quote = reactive({
  currentPrice: 0,
  priceOneMinuteAgo: 0,
  pdpm: 0,
});
const orderHistory = reactive([
  {
    process: 'none',
    balance: 'none',
    shares: 'none',
    avgSharePrice: 'none',
    typeOrder: 'none',
  },
]);
const withoutProxy = (object: object) => {
  return JSON.parse(JSON.stringify(object));
};
const selectRobinhoodTab = () => {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    const updateProperties = { active: true };
    for (const { id, url } of tabs) {
      if (url && id && url.indexOf('robinhood.com/stocks/') !== -1) {
        void chrome.tabs.update(id, updateProperties);
      }
    }
  });
};
const getSymbolFromTab = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([first]) => {
    if (first.url && first.url.indexOf('robinhood.com/stocks/') === -1) {
      selectRobinhoodTab();
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        for (const { url, id } of tabs) {
          if (url && id && url.indexOf('robinhood.com/stocks/') !== -1) {
            form.symbol = url.split('/')[4];
            form.tabId = id;
          }
        }
      });
    }
  });
};
const getStatus = () => {
  try {
    sendMessage(
      { getStatus: { tabId: form.tabId, symbol: form.symbol } },
      (response) => {
        if (lockSendStatus.value) {
          lockSendStatus.value = false;
        }
        if (!response.status.tab) {
          form.running = false;
          return;
        }
        console.log(response.status.quotes);
        form = Object.assign(form, response.status.tab);
        const { tab, quotes } = response.status;
        const quoteTimes = Object.keys(quotes);
        const currentTime = quoteTimes[quoteTimes.length - 1];
        const timeOneMinuteAgo = quoteTimes[quoteTimes.length - 2];
        const currentQuote = quotes[currentTime];
        const quoteOneMinuteAgo = quotes[timeOneMinuteAgo];

        if (
          (currentQuote && quoteOneMinuteAgo) ||
          (currentQuote.c && quoteOneMinuteAgo.c && currentQuote.pdpm)
        ) {
          quote.currentPrice = currentQuote.c.toFixed(3);
          quote.priceOneMinuteAgo = quoteOneMinuteAgo.c.toFixed(3);
          quote.pdpm = currentQuote.pdpm.toFixed(3);
        }
      },
    );
  } catch (e) {
    console.log(e);
  }
};
const sendStatus = () => {
  const msg = withoutProxy(form);
  sendMessage(
    {
      setStatus: { ...msg },
    },
    (response) => {
      if (response) {
        const { running } = response;
        if (running) {
          form.running = true;
        }
        if (!running) {
          form.running = false;
        }
      }
    },
  );
};
const testPrefill = () => {
  const data = withoutProxy(form);
  sendMessage({ testPrefill: { ...data } });
};
const testBuy = () => {
  const data = withoutProxy(form);
  sendMessage({ testBuy: { ...data } });
};
const testSell = () => {
  const data = withoutProxy(form);
  sendMessage({ testSell: { ...data } });
};

setInterval(() => {
  getSymbolFromTab();
  getStatus();
}, 1000);
onMounted(() => {
  getSymbolFromTab();
});
</script>

<template>
  <tab-view>
    <tab-panel header="Main">
      <div class="field grid">
        <label class="col-fixed">Stock symbol:</label>
        <div class="col">
          <b>{{ form.symbol }}</b>
        </div>
      </div>
      <div class="field grid justify-content-center">
        <label class="col-fixed">Price:</label>
        <div class="col">
          <b
            >${{ quote.priceOneMinuteAgo }} >>>
            {{ quote.currentPrice }}
          </b>
        </div>
      </div>
      <div class="field grid">
        <label class="col-fixed">PDPM:</label>
        <div class="col">
          <b>{{ quote.pdpm }}%</b>
        </div>
      </div>
      <!--        <div class="field grid">-->
      <!--            <label class="col-fixed">Percent Difference Per 5 Minute:</label>-->
      <!--            <div class="col"><b>{{ PDPFM }}%</b></div>-->
      <!--        </div>-->
      <div class="field grid">
        <small class="col-fixed">Buy +PDPM:</small>
        <InputNumber
          v-model="form.condition.buy.pdpm"
          :disabled="form.running || lockSendStatus"
          prefix="%"
        />
      </div>
      <div class="field grid">
        <small class="col-fixed">Sell -PDPM:</small>
        <InputNumber
          v-model="form.condition.sell.pdpm"
          :disabled="form.running || lockSendStatus"
          prefix="%"
        />
      </div>
      <div class="field grid">
        <small class="col-fixed">Order Quantity:</small>
        <InputNumber
          v-model="form.orderQuantity"
          :disabled="form.running || lockSendStatus"
        />
      </div>
      <div class="field grid">
        <div class="col -mx-2">
          <small class="col-fixed">Type order:</small>
          <Dropdown
            v-model="form.typeOrder"
            :disabled="form.running || lockSendStatus"
            :options="typesOrder"
            placeholder="Select type order"
          />
        </div>
        <div class="col -mx-2">
          <small class="col-fixed">Mode:</small>
          <Dropdown
            v-model="form.mode"
            :disabled="form.running || lockSendStatus"
            :options="modes"
            placeholder="Select mode"
          />
        </div>
      </div>
      <div class="field grid justify-content-between">
        <toggle-button
          v-model="form.running"
          :disabled="lockSendStatus"
          off-label="Stopped"
          on-label="Running"
          @click="sendStatus"
        />
        <div class="field grid my-2">
          <div class="col">
            <Button label="Buy" @click="testBuy" />
          </div>
          <div class="col">
            <Button label="Sell" @click="testSell" />
          </div>
          <div class="col">
            <Button label="Prefill" @click="testPrefill" />
          </div>
          <div class="col">
            <label>Dev: </label>
            <checkbox
              v-model="form.dev"
              :binary="true"
              :disabled="form.running || lockSendStatus"
            />
          </div>
        </div>
      </div>
    </tab-panel>
    <tab-panel header="History">
      <li v-for="item in orderHistory" class="text-xs list-none mb-2">
        P: {{ item.process }} - B: {{ item.balance }} - S: {{ item.shares }} -
        AVG: {{ item.avgSharePrice }} - T:
        {{ item.typeOrder }}
      </li>
    </tab-panel>
  </tab-view>
</template>

<style lang="sass">
#app
  font-family: Avenir, Helvetica, Arial, sans-serif
  font-size: large
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale
  color: #2c3e50
  height: 580px
  width: 330px


.p-dropdown
  width: 7rem

.p-button
  margin-right: .5rem


.p-buttonset .p-button
  margin-right: 0


.sizes .button
  margin-bottom: .5rem
  display: block


.sizes .button:last-child
  margin-bottom: 0
</style>
