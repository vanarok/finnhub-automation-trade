<script lang="ts" setup>
import { onMounted, ref } from 'vue'

const {sendMessage} = chrome.runtime
const running = ref(false)
const lockSendStatus = ref(true)
const stock = ref({symbol: 'loading...', tabId: 0})
const currentPrice = ref(0)
const previousPrice = ref(0)
const pdpm = ref(0)
const inputBuyPDPM = ref(50)
const inputSellPDPM = ref(50)
const PDPFM = ref(0)
const orderQuantity = ref(2)
const typeOrder = ref('market')
const typesOrder = ref(['market'])
const history = ref([
    {
        process: 'none',
        balance: 'none',
        shares: 'none',
        avgSharePrice: 'none',
        typeOrder: 'none'
    },
    {
        process: 'none',
        balance: 'none',
        shares: 'none',
        avgSharePrice: 'none',
        typeOrder: 'none'
    }])
const mode = ref('full')
const modes = ref(['full', 'strategy'])
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
const getStatus = () => {
    try {
        sendMessage({getStatus: {tabId: stock.value.tabId, symbol: stock.value.symbol}}, (response) => {
            if (lockSendStatus.value) lockSendStatus.value = false
            if (response && response.status) {
                running.value = true
                const status = response.status
                const keys = Object.keys(status.symbol.quote)
                const last = keys[keys.length - 1]
                const previous = keys[keys.length - 2]
                const tabSettings = response.status.tabSettings
                const currentQuote = status.symbol.quote[last]
                const previousMinute = status.symbol.quote[previous]
                const history = tabSettings.history
                if (tabSettings && currentQuote && previousMinute && history) {
                    if (currentQuote.c && previousMinute.c && currentQuote.pdpm) {
                        currentPrice.value = currentQuote.c.toFixed(2)
                        previousPrice.value = previousMinute.c.toFixed(2)
                        pdpm.value = currentQuote.pdpm.toFixed(2)
                    }
                    history.value = history
                    inputBuyPDPM.value = tabSettings.condition.buy.pdpm
                    inputSellPDPM.value = tabSettings.condition.buy.pdpm
                    orderQuantity.value = tabSettings.orderQuantity
                    typeOrder.value = tabSettings.typeOrder
                    mode.value = tabSettings.mode
                }
            } else {
                running.value = false
            }
        })
    } catch (e) {
        console.log(e)
    }
}
const sendStatus = () => {
    sendMessage({
        setStatus: {
            running: running.value,
            symbol: stock.value.symbol,
            tabId: stock.value.tabId,
            condition: {buy: {pdpm: inputBuyPDPM.value}, sell: {pdpm: -inputSellPDPM.value}},
            orderQuantity: orderQuantity.value,
            typeOrder: typeOrder.value,
            mode: mode.value
        }
    }, (response) => {
        if (response && response.running) {
            running.value = response.running
        }
    })
}
const testBuy = () => {
    sendMessage({testBuy: {tabId: stock.value.tabId}})
}
const testSell = () => {
    sendMessage({testSell: {tabId: stock.value.tabId}})
}

setInterval(() => {
    getSymbolFromTab()
    getStatus()

}, 1000)
onMounted(() => {
    getSymbolFromTab()
})
</script>

<template>
    <tab-view>
        <tab-panel header="Main">
            <div class="field grid">
                <label class="col-fixed">Stock symbol:</label>
                <div class="col">
                    <b>{{ stock.symbol }}</b>
                </div>
            </div>
            <div class="field grid justify-content-center">
                <label class="col-fixed">Price:</label>
                <div class="col">
                    <b>${{ previousPrice }} >>> {{ currentPrice }} </b>
                </div>
            </div>
            <div class="field grid">
                <label class="col-fixed">PDPM:</label>
                <div class="col"><b>{{ pdpm }}%</b></div>
            </div>
            <!--        <div class="field grid">-->
            <!--            <label class="col-fixed">Percent Difference Per 5 Minute:</label>-->
            <!--            <div class="col"><b>{{ PDPFM }}%</b></div>-->
            <!--        </div>-->
            <div class="field grid">
                <small class="col-fixed">Buy +PDPM:</small>
                <InputNumber v-model="inputBuyPDPM" :disabled="running" prefix="%"/>
            </div>
            <div class="field grid">
                <small class="col-fixed">Sell -PDPM:</small>
                <InputNumber v-model="inputSellPDPM" :disabled="running" prefix="%"/>
            </div>
            <div class="field grid">
                <small class="col-fixed">Order Quantity:</small>
                <InputNumber v-model="orderQuantity" :disabled="running"/>
            </div>
            <div class="field grid">
                <div class="col -mx-2">
                    <small class="col-fixed">Type order:</small>
                    <Dropdown v-model="typeOrder" :disabled="running" :options="typesOrder"
                              placeholder="Select type order"/>
                </div>
                <div class="col -mx-2">
                    <small class="col-fixed">Mode:</small>
                    <Dropdown v-model="mode" :disabled="running" :options="modes"
                              placeholder="Select mode"/>

                </div>
            </div>
            <div class="field grid justify-content-between">
                <toggle-button v-model="running" :disabled="lockSendStatus" off-label="Stopped"
                               on-label="Running"
                               @click="sendStatus"/>
                <div class="grid">
                    <div class="col">
                        <Button label="Buy" @click="testBuy"/>
                    </div>
                    <div class="col">
                        <Button label="Sell" @click="testSell"/>
                    </div>
                </div>
            </div>
        </tab-panel>
        <tab-panel header="History">
            <li v-for="item in history" class="text-xs list-none mb-2">
                P: {{ item.process }} - B: {{ item.balance }} - S: {{ item.shares }} -
                AVG: {{ item.avgSharePrice }} -
                T: {{ item.typeOrder }}
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
