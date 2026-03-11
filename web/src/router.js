import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Crop from './views/Crop.vue'
import Energy from './views/Energy.vue'
import Carbon from './views/Carbon.vue'
import Wisdom from './views/Wisdom.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/crop',
    name: 'Crop',
    component: Crop
  },
  {
    path: '/energy',
    name: 'Energy',
    component: Energy
  },
  {
    path: '/carbon',
    name: 'Carbon',
    component: Carbon
  },
  {
    path: '/wisdom',
    name: 'Wisdom',
    component: Wisdom
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
