const finnhubToken = 'c9uas2iad3i9vd5jj7sg'
const wsUrl = 'wss://ws.finnhub.io?token='
let ws = new WebSocket(wsUrl + finnhubToken)
const running: any = {}
let isBusy = false


const setInactiveIcon = () => {
    chrome.action.setBadgeText({text: 'OFF'})
    chrome.action.setBadgeBackgroundColor({color: 'gray'})
}

const wait = (timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout))


const unsubscribeSymbol = (symbol: string) => {
    ws.send(JSON.stringify({'type': 'unsubscribe', 'symbol': symbol}))
}
const subscribeSymbol = (symbol: string) => {
    ws.send(JSON.stringify({'type': 'subscribe', 'symbol': symbol}))
}

ws.addEventListener('message', (msg) => {
    let data = JSON.parse(msg.data)
    if (data.type === 'trade') {
        let quotes = data.data
        if (quotes) {
            for (const quote of quotes) {
                let tradeCondition = quote.c.find((element: string) => {
                    let ids = [1, 2, 3, 4, 6, 7, 8, 13, 14, 19, 23, 28, 29, 33, 35]
                    for (const id of ids) {
                        if (Number(element) === id) {
                            return true
                        }
                    }
                })

                if (tradeCondition) {
                    let quoteTime = new Date(quote.t)
                    let symbol = quote.s

                    quoteTime.setSeconds(0)
                    quoteTime.setMilliseconds(0)

                    let timeISO = Number(quoteTime)

                    if (!running[symbol]) {
                        running[symbol] = {}
                        running[symbol].quote = {}
                    }
                    if (!running[symbol].quote[timeISO]) {
                        running[symbol].quote[timeISO] = {}
                        running[symbol].quote[timeISO].o = quote.p
                        running[symbol].quote[timeISO].h = quote.p
                        running[symbol].quote[timeISO].l = quote.p
                        running[symbol].quote[timeISO].c = quote.p
                    }
                    if (!running[symbol].quote[timeISO - 60000]) {
                        running[symbol].quote[timeISO - 60000] = {}
                        running[symbol].quote[timeISO - 60000].o = quote.p
                        running[symbol].quote[timeISO - 60000].h = quote.p
                        running[symbol].quote[timeISO - 60000].l = quote.p
                        running[symbol].quote[timeISO - 60000].c = quote.p
                    }
                    if (!running[symbol].quote[timeISO].o) {
                        running[symbol].quote[timeISO].o = quote.p
                        running[symbol].quote[timeISO].o = quote.p
                    }
                    if (quote.p > running[symbol].quote[timeISO].h) {
                        running[symbol].quote[timeISO].h = quote.p
                    }
                    if (quote.p < running[symbol].quote[timeISO].l) {
                        running[symbol].quote[timeISO].l = quote.p
                    }
                    running[symbol].quote[timeISO].c = quote.p

                    let currentQuote = running[symbol].quote[timeISO]
                    let previousMinute = running[symbol].quote[timeISO - 60000]

                    running[symbol].quote[timeISO].pdpm = diffPercent(currentQuote.c, previousMinute.c)
                    // console.log(running[symbol].quote[timeISO])
                }
            }
        }
    }
})
const diffPercent = (a: number, b: number) => {
    return Number((a < b ? '-' + ((b - a) * 100) / a : ((a - b) * 100) / b))
}
const selectRobinhoodTab = (tabId: number) => {
    chrome.tabs.update(tabId, {active: true}).then(() => console.log('Tab focused'))
}
const scriptOrder = async (script: string, typeOrder: string, shares: number, price: number) => {
    const wait = (timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout))
    const x = (xpathToExecute: string) => {
        const result = []
        const nodesSnapshot = document.evaluate(xpathToExecute, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
        for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
            result.push(nodesSnapshot.snapshotItem(i))
        }

        return result
    }
    const inputChange = (node: HTMLInputElement, inputValue: string | number) => {
        const descriptor = Object.getOwnPropertyDescriptor(node, 'value')

        node.value = `${inputValue}#`
        if (descriptor && descriptor.configurable) {
            // @ts-ignore
            delete node.value
        }
        node.value = String(inputValue)

        const e = document.createEvent('HTMLEvents')
        e.initEvent('change', true, false)
        node.dispatchEvent(e)

        if (descriptor) {
            Object.defineProperty(node, 'value', descriptor)
        }
    }
    const actionBot = (action: string, selector: string | HTMLInputElement, inputValue?: string | number,) => {
        // @ts-ignore
        let htmlElement = x(selector)[0]
        if (htmlElement) {
            if (action === 'click') { // @ts-ignore
                htmlElement.click()
            }
            if (action === 'inputChange') { // @ts-ignore
                inputChange(htmlElement, String(inputValue))
            }
            if (action === 'getInputValue') { // @ts-ignore
                return htmlElement.value
            }
            if (action === 'getText') { // @ts-ignore
                return htmlElement.innerHTML
            }
            if (action === 'getElement') { // @ts-ignore
                return htmlElement
            }
            return true
        } else {
            console.log('Selector not found', 'action:', action, 'selector:', selector, 'inputValue:', inputValue, 'htmlElement:', htmlElement)
        }
    }
    let buyTabText = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[1]/div/div[1]/div/div/span'
    let buyTabButton = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[1]/div/div[1]/div/div/div[1]/div/div/h3/span/span'
    let sellTabButton = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[1]/div/div[1]/div/div/div[2]/div/div/h3/span/span'
    let orderTypeText = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[2]/div/div[1]/div/div/div/span'
    let orderTypeDropdown = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[1]/div/div[3]/div/span'
    let orderTypeLimitOrderElement = '/html/body/div[4]/div/div/div/div/div/div[2]/div/span/span'
    let orderTypeMarketElement = '/html/body/div[4]/div/div/div/div/div/div[1]/div/span/span'
    let currentMarketPriceText = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[2]/div/div[4]/div[2]/div/span'
    let sharesInput = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[2]/div/div[3]/div/div/div/input'
    let limitPriceInput = '/html/body/div[1]/main/div[2]/div/div/div/div/div/main/div/div[2]/aside/div[1]/form/div[2]/div/div[2]/div/div/div/input'
    let orderButton = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[3]/div/div[2]/div/div/button'
    let confirmOrderButton = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[3]/div/div[2]/div[1]/div/button'
    let successOrderText = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/header/h3/span'
    let sharesPurchasedText = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/div[1]/div[1]/div'
    let avgSharePriceText = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/div[1]/div[2]/div'
    let totalCreditText = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/div[1]/div[3]/div'
    let doneButton = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/div[3]/div[1]/button'

    if (script === 'prefill') {
        let sharesInputValue = Number(await actionBot('getInputValue', sharesInput))
        if (sharesInputValue !== shares) {
            await actionBot('inputChange', sharesInput, shares)
            return true
        }
        return true
    }
    if (actionBot('getElement', orderButton)) {
        // await wait(1000)
        if (script === 'buy') {
            if (!actionBot('click', buyTabButton)) {
                if (actionBot('getText', buyTabText).indexOf('Buy') === -1) {
                    return false
                }
                console.log('Buy tab already select')
            }
        }
        if (script === 'sell') {
            if (!actionBot('click', sellTabButton)) {
                console.log('Buy tab already select')
                return false
            }
        }
        await wait(3500)
        if (typeOrder === 'market') {
            if (actionBot('getText', orderTypeText) !== 'Market Order') {
                actionBot('click', orderTypeDropdown)
                await wait(3500)

                actionBot('click', orderTypeMarketElement)
                await wait(3500)
            }

            actionBot('click', orderButton)
            await wait(3500)

            actionBot('click', confirmOrderButton)
            await wait(8000)

            if (script === 'buy') {
                let purchased = actionBot('getText', successOrderText)
                if (purchased.indexOf('Purchased!') !== -1) {
                    console.log('Purchased!')
                    let result = {
                        sharesPurchased: actionBot('getText', sharesPurchasedText),
                        avgSharePrice: actionBot('getText', avgSharePriceText),
                        totalCredit: actionBot('getText', totalCreditText)
                    }
                    actionBot('click', doneButton)
                    await wait(1000)
                    return result
                }
                console.log('Purchased! not found')
            }
            if (script === 'sell') {
                let sold = actionBot('getText', successOrderText)
                if (sold.indexOf('Sold') !== -1) {
                    console.log('Sold')
                    let result = {
                        sharesSold: actionBot('getText', sharesPurchasedText),
                        avgSharePrice: actionBot('getText', avgSharePriceText),
                        totalCredit: actionBot('getText', totalCreditText)
                    }
                    actionBot('click', doneButton)
                    await wait(1000)
                    return result
                }
                console.log('Sold not found')
            }
        }
        // if (typeOrder === 'limit') {
        //     x(orderTypeDropdown)[0].click()
        //     await wait(10000)
        //
        //     x(orderTypeLimitOrderElement)[0].click()
        //     await wait(10000)
        //
        //     const nodeInputPriceLimit = x(limitPriceInput)[0]
        //     inputChange(nodeInputPriceLimit, price)
        //     await wait(10000)
        //
        //     let nodeInputShares = x(sharesInput)[0]
        //     inputChange(nodeInputShares, shares)
        //     await wait(10000)
        //
        //     return true
        // }
    }
}
const executeScript = async (tabId: number, script: string, typeOrder: string, shares: number, price: number) => {
    return await chrome.scripting.executeScript({
        target: {tabId: tabId, allFrames: true},
        func: scriptOrder,
        args: [script, typeOrder, shares, price]
    })
}
const order = async (tabId: number, script: string, typeOrder: string, shares: number, price: number) => {
    let [first] = await chrome.tabs.query({active: true, currentWindow: true})

    if (first.url && first.id === tabId && first.url.indexOf('robinhood.com/stocks') !== -1) {
        let [first] = await executeScript(tabId, script, typeOrder, shares, price)
        console.log('Result executeScript:', first)
        return first.result
    }
    if (first.id !== tabId) {
        console.log('Tab out of focus, trying to focus the tab...')
        await selectRobinhoodTab(tabId)
        await wait(5000)
        await order(tabId, script, typeOrder, shares, price)
    }
}
const stopBot = (tabId: number, symbol: string) => {
    console.log('Stop trading')
    unsubscribeSymbol(symbol)
    clearInterval(running[tabId].intervalIdCheckStrategy)
    delete running[tabId]
    chrome.action.setBadgeText({text: 'OFF'})
    chrome.action.setBadgeBackgroundColor({color: 'gray'})
    return true
}
const checkStrategy = (mode: string, tabId: number, currentQuote: any, previousQuote: any, orderQuantity: number) => {
    let currentAvgPrice = (currentQuote.h + currentQuote.l) / 2
    let previousAvgPrice = (previousQuote.h + previousQuote.l) / 2
    if (orderQuantity > 0) {
        // if (pdpm >= condition.buy.pdpm) {
        //     return 'buy'
        // }
        if (currentAvgPrice > previousQuote.h) {
            console.log('Strategy buy confirmed:', currentAvgPrice, previousQuote.h)
            if (mode === 'full') return 'buy'
        }
    }
    if (orderQuantity < 0) {
        // if (pdpm <= condition.sell.pdpm) {
        //     return 'sell'
        // }
        if (currentAvgPrice < previousAvgPrice) {
            console.log('Strategy sell confirmed:', currentAvgPrice, previousAvgPrice)
            if (mode === 'full') return 'sell'
        }
    }
}
const setIntervalCheckStrategy = (tabId: number, symbol: string, timeout: number) => {
    return running[tabId].intervalIdCheckStrategy = setInterval(async () => {
        const keys = Object.keys(running[symbol].quote)
        const last = keys[keys.length - 1]
        const previous = keys[keys.length - 2]
        let currentQuote = running[symbol].quote[last]
        let previousMinute = running[symbol].quote[previous]

        if (currentQuote && previousMinute) {
            let {condition, orderQuantity, mode, typeOrder} = running[tabId]
            let strategy = checkStrategy(mode, tabId, currentQuote, previousMinute, orderQuantity)
            let price = currentQuote.c
            if (!isBusy) {
                isBusy = true
                let prefill = await order(tabId, 'prefill', typeOrder, Math.abs(orderQuantity), price)
                if (!prefill) {
                    stopBot(tabId, symbol)
                    return
                }
                switch (strategy) {
                    case 'buy':
                        console.log('Attempted purchase...', tabId, typeOrder, orderQuantity, price)
                        let orderBuy = await order(tabId, 'buy', typeOrder, orderQuantity, price)
                        if (orderBuy) {
                            const {sharesPurchased, totalCredit, avgSharePrice} = orderBuy
                            running[tabId].history.push({
                                process: 'buy',
                                balance: totalCredit,
                                shares: sharesPurchased,
                                avgSharePrice: avgSharePrice,
                                typeOrder: typeOrder
                            })
                            running[tabId].orderQuantity = -Number(sharesPurchased)
                            isBusy = false
                            console.log('Success buy:', orderQuantity, price)
                        } else {
                            stopBot(tabId, symbol)
                            console.log('Bot stopped, buy not success', typeOrder, orderQuantity, price, orderBuy)
                        }
                        break
                    case 'sell':
                        console.log('Attempted sale...', tabId, typeOrder, orderQuantity, price)
                        let orderSell = await order(tabId, 'sell', typeOrder, Math.abs(orderQuantity), price)
                        if (orderSell) {
                            const {totalCredit, avgSharePrice, sharesSold} = orderSell
                            running[tabId].history.push({
                                process: 'sell',
                                balance: totalCredit,
                                shares: -sharesSold,
                                avgSharePrice: avgSharePrice,
                                typeOrder: typeOrder
                            })
                            running[tabId].orderQuantity = Number(sharesSold)
                            isBusy = false
                            console.log('Success sell:', Math.abs(orderQuantity), price)
                        } else {
                            console.log('Bot stopped, sell not success', typeOrder, orderQuantity, price, orderSell)
                            stopBot(tabId, symbol)
                        }
                        break
                    default:
                        console.log('Hold')
                        isBusy = false
                        break
                }
            }
        } else if (!currentQuote) {
            console.log('Stop, WebSocket broken', currentQuote, running[symbol].quote)
            stopBot(tabId, symbol)
        }
    }, timeout)
}
const startBot = async (tabId: number, symbol: string) => {
    if (ws.readyState === 3) {
        ws.close()
        ws = new WebSocket(wsUrl + finnhubToken)

        while (ws.readyState !== 1) {
            await wait(500)
        }
    }
    if (running[tabId]) {
        chrome.action.setBadgeText({text: 'ON'})
        chrome.action.setBadgeBackgroundColor({color: 'green'})
        console.log('Bot begin starting')
        // initialization
        running[symbol] = {}
        running[symbol].quote = {}
        running[tabId].history = []
        subscribeSymbol(symbol)
        // initialization
        await wait(30000)

        let intervalCheckStrategy = setIntervalCheckStrategy(tabId, symbol, 1000)
        if (intervalCheckStrategy) {
            console.log('Bot started')
            return true
        } else {
            console.log('Bot stopped, Interval not started')
            stopBot(tabId, symbol)
        }
    }
    console.log('Bot stopped', running[tabId], tabId, 'tab not found')
}

chrome.runtime.onMessage.addListener(
    async ({
               logic,
               getStatus,
               setStatus,
               testButton,
               getQuote,
               testSell,
               testBuy,
           }, sender, sendResponse) => {
        if (logic) {
            sendResponse({logic: true})
        }
        if (testSell) {
            await order(testSell.tabId, 'sell', 'market', 1, 10)
            sendResponse({success: true})
        }
        if (testBuy) {
            await order(testBuy.tabId, 'buy', 'market', 1, 10)
            sendResponse({success: true})
        }
        if (getStatus) {
            let tabSettings = running[getStatus.tabId]
            let symbol = running[getStatus.symbol]
            let response: object
            if (tabSettings && symbol) {
                response = {status: {tabSettings, symbol}}
            } else {
                response = {status: false}
            }
            sendResponse(response)
        }
        if (setStatus && setStatus.running) {
            if (setStatus.symbol && setStatus.tabId && setStatus.condition && setStatus.orderQuantity && setStatus.typeOrder) {
                running[setStatus.tabId] = {
                    condition: setStatus.condition,
                    orderQuantity: setStatus.orderQuantity,
                    typeOrder: setStatus.typeOrder,
                    mode: setStatus.mode
                }
                let start = await startBot(setStatus.tabId, setStatus.symbol)
                sendResponse({running: start})

            } else {
                console.log('Set status data wrong')
                sendResponse({running: false})
            }
        }
        if (setStatus && !setStatus.running) {
            let stop = stopBot(setStatus.tabId, running[setStatus.tabId].symbol)
            sendResponse({success: stop})

        }
        sendResponse({ping: true})
    }
)
console.log('Logic ready')
setInactiveIcon()
export {}
