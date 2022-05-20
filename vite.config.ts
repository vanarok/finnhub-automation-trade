import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                backgroundLogic: resolve(__dirname, 'background-logic/logic.html')
            },
        },
    },
    plugins: [vue(), crx({manifest})]
})

