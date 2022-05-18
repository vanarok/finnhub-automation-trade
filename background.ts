// const socket = new WebSocket('wss://ws.eodhistoricaldata.com/ws/us-quote?api_token=6280ccc9edb797.93599416')

const finnhubToken = 'c9uas2iad3i9vd5jj7sg'
const running: any = {}
let isBusy = false
let percentDifferencePerMinute: number
// let averageMinAgo = 0
// let priceHistoryPerMinute = []
// let priceHistoryPerHour = []

const diffPercent = (a: number, b: number) => {
    return Number((a < b ? '-' + ((b - a) * 100) / a : ((a - b) * 100) / b))
}
// setInterval(() => {
//     const cloneHistoryPrices = priceHistoryPerMinute
//     const cloneHistoryPricesLength = cloneHistoryPrices.length
//     priceHistoryPerMinute = []
//     let average = 0
//     for (let i = 0; i < cloneHistoryPricesLength; i++) {
//         average += cloneHistoryPrices[i]
//     }
//     average /= cloneHistoryPricesLength
//     percentDifferencePerMinute = diffPercent(average.toFixed(2), averageMinAgo.toFixed(2))
//     percentDifferencePerMinute = Number(Number.parseFloat(percentDifferencePerMinute).toFixed(2))
//     // speed = (averageMinAgo / 100) * (average - averageMinAgo)
//     // speed = Number(Number.parseFloat(speed).toFixed(2))
//     console.log(percentDifferencePerMinute, average, averageMinAgo)

function getRandomFloat(min: number, max: number, decimals: number) {
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
    let response = {c: getRandomFloat(10, 100, 3), h: getRandomFloat(10, 100, 3)}
    return response
    // return await finnhubApi(symbol, 'quote', '')
}
const getCandle = (symbol: string, resolution: string, from: number, to: number) => {
    let response = finnhubApi(symbol, 'stock/candle', '')
    return response
}
const selectRobinhoodTab = (tabId: number) => {
    chrome.tabs.update(tabId, {active: true}).then(() => console.log('Tab focused'))
}
const scriptOrder = async (script: string, typeOrder: string, shares: number, price: number,) => {
    const x = (xpathToExecute: string) => {
        const result = []
        const nodesSnapshot = document.evaluate(xpathToExecute, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
        for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
            result.push(nodesSnapshot.snapshotItem(i))
        }

        return result
    }
    const wait = (timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout))
    const inputChange = (node: HTMLInputElement, inputValue: string) => {
        const descriptor = Object.getOwnPropertyDescriptor(node, 'value')

        node.value = `${inputValue}#`
        if (descriptor && descriptor.configurable) {
            delete node.value
        }
        node.value = inputValue

        const e = document.createEvent('HTMLEvents')
        e.initEvent('change', true, false)
        node.dispatchEvent(e)

        if (descriptor) {
            Object.defineProperty(node, 'value', descriptor)
        }
    }
    let buyTab = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[1]/div/div[1]/div/div/div[1]/div/div/h3/span/span'
    let sellTab = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[1]/div/div[1]/div/div/div[2]/div/div/h3/span/span'
    let orderTypeDropdown = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[1]/div/div[3]/div/span'
    let orderTypeLimitOrder = '/html/body/div[4]/div/div/div/div/div/div[2]/div/span/span'
    let orderTypeMarket = '/html/body/div[4]/div/div/div/div/div/div[1]/div/span/span'
    let inputShares = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[2]/div/div[3]/div/div/div/input'
    let inputLimitPrice = '/html/body/div[1]/main/div[2]/div/div/div/div/div/main/div/div[2]/aside/div[1]/form/div[2]/div/div[2]/div/div/div/input'
    let buttonOrder = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[3]/div/div[2]/div/div/button'
    let buttonConfirmOrder = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[3]/div/div[2]/div[1]/div/button'
    let avgSharePrice = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/div[1]/div[2]/div'
    let totalCredit = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/div[1]/div[3]/div'
    let textSuccessOrder = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/header/h3/span'
    let buttonDone = '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/div[3]/div[1]/button'


    try {
        if (script === 'buy') {
            x(buyTab)[0].click()
            await wait(10000)
        }
        if (script === 'sell') {
            x(sellTab)[0].click()
            await wait(10000)
        }
        if (typeOrder === 'market') {
            x(orderTypeDropdown)[0].click()
            await wait(10000)

            x(orderTypeMarket)[0].click()
            await wait(10000)

            let nodeInputShares = x(inputShares)[0]
            inputChange(nodeInputShares, shares)
            await wait(10000)

            x(buttonOrder)[0].click()
            await wait(10000)

            x(buttonConfirmOrder)[0].click()
            await wait(10000)

            x(buttonDone)[0].click()
            await wait(10000)

            if (x(textSuccessOrder)[0].innerHTML === 'U Sold') {
                return true
            }
            if (x(textSuccessOrder)[0].innerHTML === 'U Purchased') {
                return true
            }
        }
        if (typeOrder === 'limit') {
            x(orderTypeDropdown)[0].click()
            await wait(10000)

            x(orderTypeLimitOrder)[0].click()
            await wait(10000)

            let nodeInputPriceLimit = x(inputLimitPrice)[0]
            inputChange(nodeInputPriceLimit, price)
            await wait(10000)

            let nodeInputShares = x(inputShares)[0]
            inputChange(nodeInputShares, shares)
            await wait(10000)
        }
        return false
    } catch (e) {
        console.log(e)
        return false
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
        return first.result
    }
    if (first.id !== tabId) {
        selectRobinhoodTab(tabId)
        setTimeout(order, 3000, tabId, shares, price)
    }
    return false
}
const stopBot = (tabId: number) => {
    console.log('Stop trading')
    clearInterval(running[tabId].intervalUpdateQuote)
    clearInterval(running[tabId].intervalHistoryPriceOneMinute)
    delete running[tabId]
    return true
}
const checkStrategy = (tabId: number, quote: any, orderQuantity: number, pdpm: number, condition: any) => {
    if (orderQuantity > 0) {
        // if (pdpm >= condition.buy.pdpm) {
        //     return 'buy'
        // }
        if (quote.c > running[tabId].quote.pm.h) {
            return 'buy'
        }
    }
    if (orderQuantity < 0) {
        // if (pdpm <= condition.sell.pdpm) {
        //     return 'sell'
        // }
        if (quote.c > running[tabId].quote.pm.c) {
            return 'sell'
        }
    }
}
const setIntervalCheckStrategy = (tabId: number, symbol: string, typeOrder: string, timeout: number) => {
    return running[tabId].intervalUpdateQuote = setInterval(async () => {
        let quote = await getQuote(symbol)
        let previousMinute = running[tabId].quote.pm ? running[tabId].quote.pm.c : quote.c
        let PDPM = diffPercent(quote.c, previousMinute)

        running[tabId].quote.rt = quote
        running[tabId].quote.pdpm = PDPM

        if (quote && previousMinute && PDPM) {
            let {condition, orderQuantity} = running[tabId]
            let strategy = checkStrategy(tabId, quote, orderQuantity, PDPM, condition)
            let price = quote.c
            if (!isBusy) {
                isBusy = true
                switch (strategy) {
                    case 'buy':
                        let orderBuy = await order(tabId, 'buy', typeOrder, orderQuantity, price)
                        if (orderBuy) {
                            running[tabId].orderQuantity = -running[tabId].orderQuantity
                            isBusy = false
                            console.log('Success buy:', orderQuantity, price)
                        } else {
                            stopBot(tabId)
                        }
                        break
                    case 'sell':
                        let orderSell = await order(tabId, 'sell', typeOrder, Math.abs(orderQuantity), price)
                        if (orderSell) {
                            running[tabId].orderQuantity = Math.abs(running[tabId].orderQuantity)
                            isBusy = false
                            console.log('Success sell:', Math.abs(orderQuantity), price)
                        } else {
                            stopBot(tabId)
                        }
                        break
                    default:
                        console.log('Hold')
                        isBusy = false
                        break
                }
            }
        } else if (!quote) {
            console.log('Stop, API broken')
            stopBot(tabId)
        }
    }, timeout)
}
const setIntervalSaveEveryMinutePrice = (tabId: number, symbol: string, timeout: number) => {
    return running[tabId].intervalHistoryPriceOneMinute = setInterval(async () => {
        running[tabId].quote.pm = await getQuote(symbol)
    }, timeout)
}
const startBot = async (tabId: number, symbol: string, typeOrder: string) => {
    if (running[tabId]) {
        let quote = await getQuote(symbol)
        if (quote) {
            // initialization
            running[tabId].quote = {}
            running[tabId].quote.rt = quote
            running[tabId].quote.pm = quote
            // initialization

            let intervalCheckStrategy = setIntervalCheckStrategy(tabId, symbol, typeOrder, 3000)
            let intervalSaveEveryMinutePrice = setIntervalSaveEveryMinutePrice(tabId, symbol, 60000)
            if (intervalCheckStrategy && intervalSaveEveryMinutePrice) {
                console.log('Interval started')
                return true
            } else {
                console.log('Interval not started')
                stopBot(tabId)
                return false
            }
        } else {
            console.log('Not started, API broken')
        }
    }
    console.log(running[tabId], tabId, 'tab not found, not started')
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
            await order(testSell.tabId, 'buy', 'market', 1, 10)
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
            running[setStatus.tabId] = {
                symbol: setStatus.symbol,
                condition: setStatus.condition,
                orderQuantity: setStatus.orderQuantity
            }
            let start = await startBot(setStatus.tabId, setStatus.symbol, setStatus.typeOrder)
            sendResponse({running: start})
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