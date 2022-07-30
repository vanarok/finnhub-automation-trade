import { defineManifest } from '@crxjs/vite-plugin';

import { version } from './package.json';

export default defineManifest({
    manifest_version: 3,
    name: 'Automation of stock trading',
    version,
    action: {
        default_icon: {
            16: 'assets/icon16-chrome.png',
            48: 'assets/icon48-chrome.png',
            128: 'assets/icon128-chrome.png',
        },
        default_popup: 'control/index.html',
    },
    permissions: ['activeTab', 'tabs', 'storage', 'background', 'scripting'],
    background: {
        service_worker: 'automation/src/background.ts',
    },
    host_permissions: ['<all_urls>'],
});
