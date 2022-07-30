import { crx } from '@crxjs/vite-plugin';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { presetWind } from 'unocss';
import Unocss from 'unocss/vite';
import { defineConfig } from 'vite';

import manifest from './manifest.config.js';

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname, './control/src'),
            $: resolve(__dirname, './automation/src'),
        },
    },
    build: {
        rollupOptions: {
            input: {
                automation: resolve(__dirname, 'automation/index.html'),
            },
        },
    },
    plugins: [Unocss({ presets: [presetWind()] }), vue(), crx({ manifest })],
});
