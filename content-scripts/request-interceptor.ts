;(function (xhr) {
    const XHR = XMLHttpRequest.prototype

    const open = XHR.open
    const send = XHR.send
    const setRequestHeader = XHR.setRequestHeader

    XHR.open = function (method, url) {
        this._method = method
        this._url = url
        this._requestHeaders = {}
        this._startTime = new Date().toISOString()

        return open.apply(this, arguments)
    }

    XHR.setRequestHeader = function (header, value) {
        this._requestHeaders[header] = value
        return setRequestHeader.apply(this, arguments)
    }

    XHR.send = function (postData) {
        this.addEventListener('load', function () {
            const endTime = new Date().toISOString()

            const myUrl = this._url ? this._url.toLowerCase() : this._url
            if (myUrl) {
                if (postData) {
                    if (typeof postData === 'string') {
                        try {
                            // here you get the REQUEST HEADERS, in JSON format, so you can also use JSON.parse
                            this._requestHeaders = postData
                        } catch (err) {
                            console.log('Request Header JSON decode failed, transfer_encoding field could be base64')
                            console.log(err)
                        }
                    } else if (
                        typeof postData === 'object' ||
                        Array.isArray(postData) ||
                        typeof postData === 'number' ||
                        typeof postData === 'boolean'
                    ) {
                        // do something if you need
                    }
                }

                // here you get the RESPONSE HEADERS
                const responseHeaders = this.getAllResponseHeaders()

                if (
                    this.responseType != 'blob' &&
                    this.responseText &&
                    this._url.indexOf('/marketdata/quotes') !== -1
                ) {
                    // responseText is string or null
                    try {
                        // here you get RESPONSE TEXT (BODY), in JSON format, so you can use JSON.parse
                        const data = this.responseText

                        if (data.length > 0) {
                            const json = JSON.parse(data)
                            const symbol = json.results[0].symbol
                            const msg = { stock: { symbol: symbol } }
                            document.dispatchEvent(new CustomEvent('message', { detail: msg }))
                        }

                        // console.log(this._url)
                        // console.log(JSON.parse(this._requestHeaders));
                        // console.log(responseHeaders);
                        // console.log(JSON.parse(arr));
                    } catch (err) {
                        console.log('Error in responseType try catch')
                        console.log(err)
                    }
                }
            }
        })

        return send.apply(this, arguments)
    }
})(XMLHttpRequest)
