import { createApp } from 'vue'
import ArcoVue from '@arco-design/web-vue'
import ArcoVueIcon from '@arco-design/web-vue/es/icon'
import '@arco-design/web-vue/dist/arco.css'
import App from './App.vue'
import router from './router.js'

const app = createApp(App)

app.use(ArcoVue)
app.use(ArcoVueIcon)
app.use(router)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err, info)
}

app.mount('#app')
