const finnhubToken = 'c9uas2iad3i9vd5jj7sg'
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
    return await finnhubApi(symbol, 'quote', '')
}
const getCandle = (symbol: string, resolution: string, from: number, to: number) => {
    return finnhubApi(symbol, 'stock/candle', '')
}
export { finnhubApi, getQuote, getCandle }