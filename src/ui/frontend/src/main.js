import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './assets/css/tailwind.css'

const app = createApp(App)

app.use(router)

// vue-tippy
import VueTippy from 'vue-tippy'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light.css'
import 'tippy.js/themes/material.css'
import 'tippy.js/themes/translucent.css'
import 'tippy.js/themes/light-border.css'
app.use(
  VueTippy,
  {
    arrow: true,
    allowHTML: true,
    theme: 'light'
  }
)

app.mount('#app')
