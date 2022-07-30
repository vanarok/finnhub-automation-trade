export const finnhubToken = 'c9uas2iad3i9vd5jj7sg'
export const finnhub = async (symbol: string, path: string, option: string) => {
    const response = await fetch(
        `https://finnhub.io/api/v1/${path}?symbol=${symbol}&token=${finnhubToken}${
            option !== '' ? '&' + option : ''
        }`,
    )
    if (response.status === 200) {
        return response.json()
    } else {
        console.log(response.status)
        return false
    }
}
export const getQuote = async (symbol: string) => {
    return await finnhub(symbol, 'quote', '')
}
export const getCandle = (
    symbol: string,
    resolution: string,
    from: number,
    to: number,
) => {
    return finnhub(symbol, 'stock/candle', '')
}
