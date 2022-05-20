// // let s = document.createElement('script')
// //
// // s.src = chrome.runtime.getURL('content-scripts/request-interceptor.ts')
// // s.onload = function () {
// //     this.remove()
// // }
// // ;(document.head || document.documentElement).appendChild(s)
// let lastSymbol: number = 0
// let port
// document.addEventListener('message', function (msg) {
//     if (msg.detail.stock) {
//         if (lastSymbol !== msg.detail.stock.symbol) {
//             // chrome.runtime.sendMessage({ setSymbol: msg.detail.stock.symbol }, () => {
//             lastSymbol = msg.detail.stock.symbol
//             // })
//         }
//     }
// })
//
// const connect = () => {
//     port = chrome.runtime.connect({name: 'foo'})
//     port.onDisconnect.addListener(connect)
//     port.onMessage.addListener(msg => {
//         console.log('received', msg, 'from bg')
//     })
// }
//
// connect()
console.log('Init content-script')
