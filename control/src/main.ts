import 'primevue/resources/themes/saga-blue/theme.css';
import 'primevue/resources/primevue.min.css';
// import 'primeflex/primeflex.min.css'
// import 'primeicons/primeicons.css'
import 'uno.css';

import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import PrimeVue from 'primevue/config';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import TabPanel from 'primevue/tabpanel';
import TabView from 'primevue/tabview';
import ToggleButton from 'primevue/togglebutton';
import { createApp } from 'vue';

import App from './App.vue';

const { use, mount, component } = createApp(App);

use(PrimeVue, { ripple: true });
component('Button', Button);
component('ToggleButton', ToggleButton);
component('InputNumber', InputNumber);
component('Dropdown', Dropdown);
component('TabView', TabView);
component('TabPanel', TabPanel);
component('Checkbox', Checkbox);

mount('#app');
