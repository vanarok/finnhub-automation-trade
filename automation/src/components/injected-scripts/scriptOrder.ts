import type { ResultInjectOrder } from '$/components/injected-scripts/types.js';
import { Process } from '$/components/logic/types.js';

export default async (
    process: string,
    typeOrder: string,
    orderQuantity: number,
    price: number,
): Promise<ResultInjectOrder> => {
    const wait = (timeout: number) =>
        // eslint-disable-next-line no-promise-executor-return
        new Promise((resolve) => setTimeout(resolve, timeout));
    const x = (xpathToExecute: string): Array<Node> => {
        const result: Array<Node> = [];
        const nodesSnapshot = document.evaluate(
            xpathToExecute,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null,
        );
        for (let index = 0; index < nodesSnapshot.snapshotLength; index++) {
            const node = nodesSnapshot.snapshotItem(index);

            if (node) {
                result.push(node);
            }
        }

        return result;
    };
    const input = (xpath: string, inputValue: string) => {
        const input = x(xpath)[0];
        if (input && input instanceof HTMLInputElement) {
            const descriptor = Object.getOwnPropertyDescriptor(input, 'value');

            input.value = `${inputValue}#`;
            if (descriptor && descriptor.configurable) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                delete input.value;
            }
            input.value = inputValue;

            const event = document.createEvent('HTMLEvents');
            event.initEvent('change', true, false);
            input.dispatchEvent(event);

            if (descriptor) {
                Object.defineProperty(input, 'value', descriptor);
            }
            return true;
        }
    };
    const click = (xpath: string) => {
        const button = x(xpath)[0];
        const event = document.createEvent('MouseEvents');
        event.initEvent('click', true, false);
        if (button) {
            button.dispatchEvent(event);
            return true;
        }
        return false;
    };
    const getInputValue = (xpath: string) => {
        const element = x(xpath)[0];
        return element && element instanceof HTMLInputElement
            ? element.value
            : false;
    };
    const getText = (xpath: string) => {
        const element = x(xpath)[0];
        return element ? element.textContent || '' : '';
    };
    const getElement = (xpath: string) => {
        const node = x(xpath)[0];
        return node || false;
    };
    const buyTabText =
        '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[1]/div/div[1]/div/div/span';
    const buyTabButton =
        '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[1]/div/div[1]/div/div/div[1]/div/div/h3/span/span';
    const sellTabButton =
        '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[1]/div/div[1]/div/div/div[2]/div/div/h3/span/span';
    const orderTypeText =
        '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[2]/div/div[1]/div/div/div/span';
    const orderTypeDropdown =
        '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[1]/div/div[3]/div/span';
    const orderTypeLimitOrderElement =
        '/html/body/div[4]/div/div/div/div/div/div[2]/div/span/span';
    const orderTypeMarketElement =
        '/html/body/div[4]/div/div/div/div/div/div[1]/div/span/span';
    const currentMarketPriceText =
        '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[2]/div/div[4]/div[2]/div/span';
    const sharesInput =
        '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[2]/div/div[3]/div/div/div/input';
    const limitPriceInput =
        '/html/body/div[1]/main/div[2]/div/div/div/div/div/main/div/div[2]/aside/div[1]/form/div[2]/div/div[2]/div/div/div/input';
    const orderButton =
        '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[3]/div/div[2]/div/div/button';
    const orderSummaryText =
        '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/form/div[3]/div/div[1]/div/div/div/span';
    const successOrderText =
        '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/header/h3/span';
    const sharesText =
        '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/div[1]/div[1]/div';
    const avgSharePriceText =
        '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/div[1]/div[2]/div';
    const totalCreditText =
        '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/div[1]/div[3]/div';
    const doneButton =
        '//*[@id="sdp-ticker-symbol-highlight"]/aside/div[1]/div/div[3]/div[1]/button';

    async function prefill() {
        console.log('Prefill started', new Date());
        if (!getElement(orderButton)) {
            console.log('Button order not found ');
            return { error: 'Button order not found' };
        }
        if (getElement(orderSummaryText)) {
            return { data: [] };
        }
        if (orderQuantity > 0) {
            if (getElement(sellTabButton)) {
                while (!click(buyTabButton)) {
                    console.log('Buy tab not exists');
                    await wait(1000);
                }
            } else {
                console.log('Sell button tab not found');
            }
        } else if (orderQuantity < 0) {
            while (!click(sellTabButton)) {
                console.log('Tab sell click not success');
                await wait(1000);
            }
        } else {
            console.log('Shares is wrong');
            return { error: 'Shares is wrong' };
        }
        if (typeOrder === 'market') {
            while (!getText(orderTypeText).includes('Market Order')) {
                while (!click(orderTypeDropdown)) {
                    console.log('Open dropdown not success!');
                    await wait(1000);
                }
                console.log('Open dropdown success!');
                while (!click(orderTypeMarketElement)) {
                    console.log('Select type order "market" not success!');
                    await wait(1000);
                }
                console.log('Select type order "market" success!');
                await wait(1000);
            }
        } else if (typeOrder === 'limit') {
            console.log('Limit order not ready');
        } else {
            console.log('typeOrder not defined');
            return { error: 'typeOrder not defined' };
        }
        orderQuantity = Math.abs(orderQuantity);
        while (Number(getInputValue(sharesInput)) !== orderQuantity) {
            console.log('Input not changed');
            input(sharesInput, String(orderQuantity));
            await wait(1000);
        }
        while (!click(orderButton)) {
            console.log('Order button not found');
            await wait(1000);
        }
        await wait(3000);
        console.log('Prefill end', new Date());
        return { data: [] };
    }

    const order = async () => {
        console.log('Order started', new Date());
        if (!getElement(orderSummaryText)) {
            console.log('Order not confirmed');
            return { error: 'Order not confirmed' };
        }
        if (typeOrder === 'market') {
            while (!click(orderButton)) {
                console.log('Confirm order not found');
                await wait(1000);
            }
            while (!getText(totalCreditText)) {
                console.log('Total credit text not found');
                await wait(1000);
            }
            const order = {
                process,
                balance: Number(getText(totalCreditText)),
                shares: Number(getText(sharesText)),
                avgSharePrice: Number(getText(avgSharePriceText)),
                typeOrder,
            };
            while (!click(doneButton)) {
                console.log('Done button not found');
                await wait(1000);
            }
            console.log('Order end', new Date());
            await wait(3000);
            return { data: [order] };
        }
        if (typeOrder === 'limit') {
            console.log('Limit order not ready');
            return { error: 'Limit order not ready' };
        }
        console.log('Type order not defined');
        return { error: 'Type order not defined' };
    };

    if (process === Process.Prefill) {
        return await prefill();
    }

    if (process === Process.Buy || process === Process.Sell) {
        return await order();
    }
    return { error: 'Script is not prefill or buy or sell' };
};
