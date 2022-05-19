const finnhubToken = 'c9uas2iad3i9vd5jj7sg'
const socket = new WebSocket('wss://ws.finnhub.io?token=' + finnhubToken)

const running: any = {}
let isBusy = false

const unsubscribeSymbol = (symbol: string) => {
    socket.send(JSON.stringify({'type': 'unsubscribe', 'symbol': symbol}))
}

const subscribeSymbol = (symbol: string) => {
    socket.addEventListener('open', event => {
        socket.send(JSON.stringify({'type': 'subscribe', 'symbol': symbol}))
    })
}

const subscribeTradeMessages = (tabId: number, symbol: string) => {
    socket.addEventListener('message', (msg) => {
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

                        if (quote.s === symbol && tradeCondition) {
                            let quoteTime = new Date(quote.t)

                            quoteTime.setSeconds(0)
                            quoteTime.setMilliseconds(0)

                            let timeISO = Number(quoteTime)
                            let currentQuote = running[tabId].quote[timeISO]
                            let previousMinute = running[tabId].quote[timeISO - 60000]

                            running[tabId].quote[timeISO].pdpm = diffPercent(currentQuote.c, previousMinute.c)

                            if (!running[tabId]) {
                                running[tabId] = {}
                                running[tabId].quote = {}
                            }
                            if (!running[tabId].quote[timeISO]) {
                                running[tabId].quote[timeISO] = {}
                                running[tabId].quote[timeISO].o = quote.p
                                running[tabId].quote[timeISO].h = quote.p
                                running[tabId].quote[timeISO].l = quote.p
                                running[tabId].quote[timeISO].c = quote.p
                            }
                            if (!running[tabId].quote[timeISO - 60000]) {
                                running[tabId].quote[timeISO - 60000] = {}
                                running[tabId].quote[timeISO - 60000].o = quote.p
                                running[tabId].quote[timeISO - 60000].h = quote.p
                                running[tabId].quote[timeISO - 60000].l = quote.p
                                running[tabId].quote[timeISO - 60000].c = quote.p
                            }
                            if (!running[tabId].quote[timeISO].o) {
                                running[tabId].quote[timeISO].o = quote.p
                                running[tabId].quote[timeISO].o = quote.p
                            }
                            if (quote.p > running[tabId].quote[timeISO].h) {
                                running[tabId].quote[timeISO].h = quote.p
                            }
                            if (quote.p < running[tabId].quote[timeISO].l) {
                                running[tabId].quote[timeISO].l = quote.p
                            }
                            running[tabId].quote[timeISO].c = quote.p
                            console.log(running[tabId].quote[timeISO])
                        }
                    }
                }
            }
        }
    )
}
const wait = (timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout))
const diffPercent = (a: number, b: number) => {
    return Number((a < b ? '-' + ((b - a) * 100) / a : ((a - b) * 100) / b))
}
const getRandomFloat = (min: number, max: number, decimals: number) => {
    const str = (Math.random() * (max - min) + min).toFixed(decimals)
    return parseFloat(str)
}
const finnhubApi = async (symbol: string, path: string, option: string) => {
    let response = await fetch(`https://finnhub.io/api/v1/${path}?symbol=${symbol}&token=${finnhubToken}${option !== '' ? '&' + option : ''}`)
    if (response.status === 200) {
        return response.json()
    } else {
        console.log(response.status)
        return false
    }
}
const getQuote = async (symbol: string) => {
    // let response = {c: getRandomFloat(10, 100, 3), h: getRandomFloat(10, 100, 3)}
    // return response
    return await finnhubApi(symbol, 'quote', '')
}
const getCandle = (symbol: string, resolution: string, from: number, to: number) => {
    let response = finnhubApi(symbol, 'stock/candle', '')
    return response
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
        let htmlElement = x(selector)[0]
        if (htmlElement) {
            if (action === 'click') { // @ts-ignore
                htmlElement.click()
            }
            if (action === 'inputChange') { // @ts-ignore
                inputChange(htmlElement, String(inputValue))
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
    let textBuyTab = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[1]/div/div[1]/div/div/span'
    let buyTab = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[1]/div/div[1]/div/div/div[1]/div/div/h3/span/span'
    let sellTab = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[1]/div/div[1]/div/div/div[2]/div/div/h3/span/span'
    let orderTypeField = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[2]/div/div[1]/div/div/div/span'
    let orderTypeDropdown = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[1]/div/div[3]/div/span'
    let orderTypeLimitOrderElement = '/html/body/div[4]/div/div/div/div/div/div[2]/div/span/span'
    let orderTypeMarketElement = '/html/body/div[4]/div/div/div/div/div/div[1]/div/span/span'
    let inputShares = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[2]/div/div[3]/div/div/div/input'
    let marketPriceField = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[2]/div/div[4]/div[2]/div/span'
    let inputLimitPrice = '/html/body/div[1]/main/div[2]/div/div/div/div/div/main/div/div[2]/aside/div[1]/form/div[2]/div/div[2]/div/div/div/input'
    let buttonOrder = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[3]/div/div[2]/div/div/button'
    let buttonConfirmOrder = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[3]/div/div[2]/div[1]/div/button'
    let textSuccessOrder = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/header/h3/span'
    let sharesPurchased = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/div[1]/div[1]/div'
    let avgSharePrice = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/div[1]/div[2]/div'
    let totalCredit = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/div[1]/div[3]/div'
    let buttonDone = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/div[3]/div[1]/button'

    if (actionBot('getElement', buttonOrder)) {
        await wait(1000)
        if (script === 'buy') {
            if (!actionBot('click', buyTab)) {
                if (actionBot('getText', textBuyTab) !== 'Buy U') {
                    return false
                }
                console.log('Buy tab already select')
            }
        }
        if (script === 'sell') {
            if (!actionBot('click', sellTab)) {
                console.log('Buy tab already select')
                return false
            }
        }
        await wait(5000)
        if (typeOrder === 'market') {
            if (actionBot('getText', orderTypeField) !== 'Market Order') {
                actionBot('click', orderTypeDropdown)
                await wait(5000)

                actionBot('click', orderTypeMarketElement)
                await wait(5000)
            }
            actionBot('inputChange', inputShares, shares)
            await wait(5000)

            actionBot('click', buttonOrder)
            await wait(5000)

            actionBot('click', buttonConfirmOrder)
            await wait(30000)

            if (script === 'buy') {
                let purchased = actionBot('getText', textSuccessOrder)
                if (purchased === 'U Purchased!') {
                    console.log('U Purchased!')
                    let result = {
                        sharesPurchased: actionBot('getText', sharesPurchased),
                        avgSharePrice: actionBot('getText', avgSharePrice),
                        totalCredit: actionBot('getText', totalCredit)
                    }
                    actionBot('click', buttonDone)
                    await wait(5000)
                    console.log(result)
                    return result
                }
                console.log('U Purchased! not found')
            }
            if (script === 'sell') {
                let sold = actionBot('getText', textSuccessOrder)
                await wait(5000)
                if (sold === 'U Sold') {
                    console.log('U Sold')
                    let result = {
                        sharesSold: actionBot('getText', sharesPurchased),
                        avgSharePrice: actionBot('getText', avgSharePrice),
                        totalCredit: actionBot('getText', totalCredit)
                    }
                    actionBot('click', buttonDone)
                    await wait(5000)
                    console.log(result)
                    return result
                }
                console.log('U Sold not found')
            }
        }
        if (typeOrder === 'limit') {
            x(orderTypeDropdown)[0].click()
            await wait(10000)

            x(orderTypeLimitOrderElement)[0].click()
            await wait(10000)

            const nodeInputPriceLimit = x(inputLimitPrice)[0]
            inputChange(nodeInputPriceLimit, price)
            await wait(10000)

            let nodeInputShares = x(inputShares)[0]
            inputChange(nodeInputShares, shares)
            await wait(10000)

            return true
        }
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
        selectRobinhoodTab(tabId)
        setTimeout(order, 3000, tabId, shares, price)
    }
}
const stopBot = (tabId: number) => {
    console.log('Stop trading')
    clearInterval(running[tabId].intervalUpdateQuote)
    clearInterval(running[tabId].intervalHistoryPriceOneMinute)
    delete running[tabId]
    return true
}
const checkStrategy = (tabId: number, currentQuote: any, previousQuote: any, orderQuantity: number) => {
    let currentAvgPrice = (currentQuote.h + currentQuote.l) / 2
    let previousAvgPrice = (previousQuote.h + previousQuote.l) / 2
    if (orderQuantity > 0) {
        // if (pdpm >= condition.buy.pdpm) {
        //     return 'buy'
        // }
        if (currentAvgPrice > previousQuote.h) {
            return 'buy'
        }
    }
    if (orderQuantity < 0) {
        // if (pdpm <= condition.sell.pdpm) {
        //     return 'sell'
        // }
        if (currentAvgPrice < previousAvgPrice) {
            return 'sell'
        }
    }
}
const setIntervalCheckStrategy = (tabId: number, symbol: string, typeOrder: string, timeout: number) => {
    return running[tabId].intervalUpdateQuote = setInterval(async () => {
        let time = new Date()
        time.setSeconds(0)
        time.setMilliseconds(0)
        let timeISO = Number(time)
        let currentQuote = running[tabId].quote[timeISO]
        let previousMinute = running[tabId].quote[timeISO - 60000]

        if (currentQuote && previousMinute) {
            let {condition, orderQuantity} = running[tabId]
            let strategy = checkStrategy(tabId, currentQuote, previousMinute, orderQuantity)
            let price = currentQuote.c
            if (!isBusy) {
                isBusy = true

                switch (strategy) {
                    case 'buy':
                        console.log('Attempted purchase...', tabId, typeOrder, orderQuantity, price)
                        let orderBuy = await order(tabId, 'buy', typeOrder, orderQuantity, price)
                        if (orderBuy) {
                            running[tabId].history.push({
                                process: 'buy',
                                balance: -price,
                                shares: orderQuantity,
                                typeOrder: typeOrder
                            })
                            running[tabId].orderQuantity = -running[tabId].orderQuantity
                            isBusy = false
                            console.log('Success buy:', orderQuantity, price)
                        } else {
                            stopBot(tabId)
                            console.log('Bot stopped, buy not success')
                        }
                        break
                    case 'sell':
                        console.log('Attempted sale...', tabId, typeOrder, orderQuantity, price)
                        let orderSell = await order(tabId, 'sell', typeOrder, Math.abs(orderQuantity), price)
                        if (orderSell) {
                            running[tabId].history.push({
                                process: 'sell',
                                balance: price,
                                shares: -orderQuantity,
                                typeOrder: typeOrder
                            })
                            running[tabId].orderQuantity = Math.abs(running[tabId].orderQuantity)
                            isBusy = false
                            console.log('Success sell:', Math.abs(orderQuantity), price)
                        } else {
                            console.log('Bot stopped, sell not success')
                            stopBot(tabId)
                        }
                        break
                    default:
                        console.log('Hold')
                        isBusy = false
                        break
                }
            }
        } else if (!currentQuote) {
            console.log('Stop, WebSocket broken', currentQuote, running[tabId].quote)
            stopBot(tabId)
        }
    }, timeout)
}
const startBot = async (tabId: number, symbol: string, typeOrder: string) => {
    if (running[tabId]) {
        // initialization
        running[tabId].quote = {}
        running[tabId].history = []
        // initialization

        subscribeSymbol(symbol)
        subscribeTradeMessages(tabId, symbol)
        await wait(10000)

        let intervalCheckStrategy = setIntervalCheckStrategy(tabId, symbol, typeOrder, 3000)
        if (intervalCheckStrategy) {
            console.log('Bot started')
            return true
        } else {
            console.log('Bot stopped, Interval not started')
            stopBot(tabId)
        }
    }
    console.log('Bot stopped', running[tabId], tabId, 'tab not found')
}
chrome.runtime.onMessage.addListener(
    async ({
               getStatus,
               setStatus,
               testButton,
               getQuote,
               testSell,
               testBuy,
           }, sender, sendResponse) => {
        if (testSell) {
            await order(testSell.tabId, 'sell', 'market', 1, 10)
            sendResponse({success: true})
        }
        if (testBuy) {
            await order(testBuy.tabId, 'buy', 'market', 1, 10)
            sendResponse({success: true})
        }
        if (getStatus) {
            let tab = running[getStatus.tabId]
            sendResponse({running: tab})
        }
        if (setStatus && setStatus.running) {
            if (setStatus.running && setStatus.symbol && setStatus.tabId && setStatus.condition && setStatus.orderQuantity && setStatus.typeOrder) {
                running[setStatus.tabId] = {
                    condition: setStatus.condition,
                    orderQuantity: setStatus.orderQuantity
                }
                console.log(setStatus.typeOrder)
                let start = await startBot(setStatus.tabId, setStatus.symbol, setStatus.typeOrder)
                sendResponse({running: start})
            } else {
                console.log('Set status data wrong')
                sendResponse({running: false})
            }
        }
        if (setStatus && !setStatus.running) {
            let stop = stopBot(setStatus.tabId)
            sendResponse({success: stop})
        }
        sendResponse({ping: true})
    }
)

// socket.addEventListener('message', ({data}) => {
//         let quote = JSON.parse(data)
//         console.log(quote)
//         let tabId: number
//         for (const [key, value] of Object.entries(running)) {
//             if (value.symbol === quote.s) {
//                 // @ts-ignore
//                 tabId = Number(key)
//             }
//
//         }
//         console.log(true)
//         running[tabId].quote.rt = quote
//         running[tabId].quote.pdpm = diffPercent(running[tabId].quote.rt.p, running[tabId].quote.pm.p)
//         // if (msg.type === 'trade') {
//         //     lastPrice = msg.data[msg.data.length - 1].p
//         //     priceHistoryPerMinute.push(msg.data[0].p)
//         // }
//     }
// )
// Service KeepAlive
chrome.runtime.onConnect.addListener(port => {
    if (port.name !== 'foo') return
    port.onMessage.addListener(onMessage)
    port.onDisconnect.addListener(deleteTimer)
    port._timer = setTimeout(forceReconnect, 250e3, port)
})

function onMessage(msg, port) {
    console.log('received', msg, 'from', port.sender)
}

function forceReconnect(port) {
    deleteTimer(port)
    port.disconnect()
}

function deleteTimer(port) {
    if (port._timer) {
        clearTimeout(port._timer)
        delete port._timer
    }
}

let lifeline

keepAlive()

chrome.runtime.onConnect.addListener(port => {
    if (port.name === 'keepAlive') {
        lifeline = port
        setTimeout(keepAliveForced, 295e3) // 5 minutes minus 5 seconds
        port.onDisconnect.addListener(keepAliveForced)
    }
})

function keepAliveForced() {
    lifeline?.disconnect()
    lifeline = null
    keepAlive()
}

async function keepAlive() {
    if (lifeline) return
    for (const tab of await chrome.tabs.query({url: '*://*/*'})) {
        try {
            await chrome.scripting.executeScript({
                target: {tabId: tab.id},
                function: () => chrome.runtime.connect({name: 'keepAlive'}),
                // `function` will become `func` in Chrome 93+
            })
            chrome.tabs.onUpdated.removeListener(retryOnTabUpdate)
            return
        } catch (e) {
        }
    }
    chrome.tabs.onUpdated.addListener(retryOnTabUpdate)
}

async function retryOnTabUpdate(tabId, info, tab) {
    if (info.url && /^(file|https?):/.test(info.url)) {
        keepAlive()
    }
}

console.log('Init background')
export {}