import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import 'primevue/resources/themes/saga-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeflex/primeflex.min.css'
import 'primeicons/primeicons.css'
import Button from 'primevue/button'
import ToggleButton from 'primevue/togglebutton'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'

const {use, mount, component} = createApp(App)

use(PrimeVue, {ripple: true})
component('Button', Button)
component('ToggleButton', ToggleButton)
component('InputNumber', InputNumber)
component('Dropdown', Dropdown)

mount('#app')
