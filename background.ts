const openBackgroundLogic = async () => {
    await chrome.tabs.create({url: 'background-logic/logic.html'})
}
const initLogic = async () => {
    try {
        let response = await chrome.runtime.sendMessage({logic: true},)
        if (!response.logic) {
            openBackgroundLogic()
        }
    } catch (e) {
        openBackgroundLogic()
        console.log('Page with background logic not exists')
    }
}
initLogic().then(r => console.log('Init logic'))
export {}