import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import Vant from 'vant'
import 'element-plus/dist/index.css'
import 'vant/lib/index.css'
import './styles/theme.css'
import App from './App.vue'

const app = createApp(App)
app.use(ElementPlus)
app.use(Vant)
app.mount('#app')
