const openBackgroundLogic = async () => {
    await chrome.tabs.create({ url: 'automation/index.html' });
};
const initLogic = async () => {
    try {
        const response: { logic: boolean } = await chrome.runtime.sendMessage({
            logic: true,
        });
        if (!response.logic) {
            await openBackgroundLogic();
        }
    } catch (error) {
        await openBackgroundLogic();
        console.log('Page with background logic not exists', error);
    }
};
await initLogic();
console.log('initLogic ready');
export { };
