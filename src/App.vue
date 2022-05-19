<script lang="ts" setup>
import { onMounted, ref } from 'vue'

const {sendMessage, onConnect} = chrome.runtime
const running = ref(false)
const disabledRunning = ref(true)
const stock = ref({symbol: 'loading...', tabId: 0})
const currentPrice = ref(0)
const previousPrice = ref(0)
const PDPM = ref(0)
const inputBuyPDPM = ref(50)
const inputSellPDPM = ref(50)
const PDPFM = ref(0)
const orderQuantity = ref(2)
const typeOrder = ref('market')
const typesOrder = ref(['market', 'limit'])
const history = ref([{process: 'none', balance: 'none', shares: 'none', typeOrder: 'none'}])

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
    sendMessage({getStatus: {tabId: stock.value.tabId}}, (response) => {
        if (response.running) {
            console.log(response.running)
            let time = new Date()
            time.setSeconds(0)
            time.setMilliseconds(0)
            let timeISO = Number(time)
            running.value = true
            currentPrice.value = response.running.quote[timeISO].c.toFixed(2)
            previousPrice.value = response.running.quote[timeISO].c.toFixed(2)
            PDPM.value = response.running.quote[timeISO].pdpm.toFixed(2)
            history.value = response.running.history
        } else {
            running.value = false
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
            orderQuantity: orderQuantity.value,
            typeOrder: typeOrder.value
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
                <div class="col"><b>{{ PDPM }}%</b></div>
            </div>
            <!--        <div class="field grid">-->
            <!--            <label class="col-fixed">Percent Difference Per 5 Minute:</label>-->
            <!--            <div class="col"><b>{{ PDPFM }}%</b></div>-->
            <!--        </div>-->
            <div class="field grid">
                <label class="col-fixed">Buy +PDPM:</label>
                <InputNumber v-model="inputBuyPDPM" prefix="%"/>
            </div>
            <div class="field grid">
                <label class="col-fixed">Sell -PDPM:</label>
                <InputNumber v-model="inputSellPDPM" prefix="%"/>
            </div>
            <div class="field grid">
                <label class="col-fixed">Order Quantity:</label>
                <InputNumber v-model="orderQuantity"/>
            </div>
            <div class="field grid">
                <Dropdown v-model="typeOrder" :options="typesOrder" placeholder="Select type order"/>
            </div>
            <div class="field grid justify-content-between">
                <toggle-button v-model="running" :disabled="disabledRunning" off-label="Stopped" on-label="Running"
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
            <li v-for="item in history">
                {{ item.process }} - {{ item.balance }} - {{ item.shares }} - {{ item.typeOrder }}
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
    width: 300px

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
