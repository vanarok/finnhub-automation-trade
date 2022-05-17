<script lang="ts" setup>
import { onMounted, ref } from 'vue'


const {sendMessage, onConnect} = chrome.runtime
const running = ref(false)
const disabledRunning = ref(true)
const stock = ref({symbol: 'loading...', tabId: 0})
const price = ref(0)
const previousPrice = ref(0)
const PDPM = ref(0)
const inputBuyPDPM = ref(50)
const inputSellPDPM = ref(50)
const PDPFM = ref(0)
const orderQuantity = ref(2)
const percentDifferencePerFiveMinute = ref(0)

const selectRobinhoodTab = () => {
    chrome.tabs.query({currentWindow: true}, (tabs) => {
        const updateProperties = {active: true}
        for (const tab of tabs) {
            if (tab.url && tab.id && tab.url.indexOf('robinhood.com/stocks/') !== -1) {
                chrome.tabs.update(tab.id, updateProperties)
            }
        }
    })
}
const getSymbolFromTab = () => {
    chrome.tabs.query({active: true, currentWindow: true}, ([first]) => {
        if (first.url && first.url.indexOf('robinhood.com/stocks/') === -1) {
            selectRobinhoodTab()
        } else {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                for (const tab of tabs) {
                    if (tab.url && tab.id && tab.url.indexOf('robinhood.com/stocks/') !== -1) {
                        stock.value.symbol = tab.url.split('/')[4]
                        stock.value.tabId = tab.id
                    }
                }
            })
        }
    })
}
const getQuote = () => {
    sendMessage({getQuote: {tabId: stock.value.tabId}}, (response) => {
        if (response.quote) {
            price.value = response.quote.rt.c.toFixed(2)
            previousPrice.value = response.quote.pm.c.toFixed(2)
            PDPM.value = response.quote.pdpm.toFixed(2)
            PDPFM.value = response.quote.pdpfm.toFixed(2)
        }
    })
}
const getStatus = () => {
    sendMessage({getStatus: {tabId: stock.value.tabId}}, (response) => {
        if (response.running) {
            running.value = response.running
        }
        if (disabledRunning.value) disabledRunning.value = false
    })
}
const sendStatus = () => {
    sendMessage({
        setStatus: {
            running: running.value,
            symbol: stock.value.symbol,
            tabId: stock.value.tabId,
            condition: {buy: {pdpm: inputBuyPDPM.value}, sell: {pdpm: -inputBuyPDPM.value}},
            orderQuantity: orderQuantity.value
        }
    }, (response) => {
        if (response.running) {
            running.value = response.running
        }
    })
}
// const testButton = () => {
//     sendMessage({testButton: true})
// }
const testBuy = () => {
    sendMessage({testBuy: {tabId: stock.value.tabId}})
}
const testSell = () => {
    sendMessage({testSell: {tabId: stock.value.tabId}})
}
setInterval(() => {
    getSymbolFromTab()
    getQuote()
    getStatus()
}, 1000)
onMounted(() => {
    getSymbolFromTab()
})
</script>

<template>
    <div class="w-full h-full line-height-3 mt-4 m-2">
        <div class="field grid">
            <label class="col-fixed">Stock symbol:</label>
            <div class="col">
                <b>{{ stock.symbol }}</b>
            </div>
        </div>
        <div class="field grid justify-content-center">
            <label class="col-fixed">Price:</label>
            <b>${{ previousPrice }}</b>
            <div class="col"> >>> <b>${{ price }}</b></div>
        </div>
        <div class="field grid">
            <label class="col-fixed">PDPM:</label>
            <div class="col"><b>{{ PDPM }}%</b></div>
        </div>
        <!--        <div class="field grid">-->
        <!--            <label class="col-fixed">Percent Difference Per 5 Minute:</label>-->
        <!--            <div class="col"><b>{{ PDPFM }}%</b></div>-->
        <!--        </div>-->
        <div class="field grid">
            <label class="col-fixed">Buy US:</label>
            <InputNumber v-model="inputBuyPDPM" prefix="%"/>
        </div>
        <div class="field grid">
            <label class="col-fixed">Sell DS:</label>
            <InputNumber v-model="inputSellPDPM" prefix="%"/>
        </div>
        <div class="field grid">
            <label class="col-fixed">Order Quantity:</label>
            <InputNumber v-model="orderQuantity"/>
        </div>
        <div class="field grid justify-content-center">
            <toggle-button v-model="running" :disabled="disabledRunning" off-label="Stopped" on-label="Running"
                           @click="sendStatus"/>
            <Button label="Buy" @click="testBuy"/>
            <Button label="Sell" @click="testSell"/>
        </div>
    </div>
</template>

<style lang="sass">
#app
    font-family: Avenir, Helvetica, Arial, sans-serif
    font-size: large
    -webkit-font-smoothing: antialiased
    -moz-osx-font-smoothing: grayscale
    color: #2c3e50
    height: 400px
    width: 350px
</style>
