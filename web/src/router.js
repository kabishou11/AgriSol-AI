import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Dashboard from './views/Dashboard.vue'
import Profile from './views/Profile.vue'
import Crop from './views/Crop.vue'
import Energy from './views/Energy.vue'
import Carbon from './views/Carbon.vue'
import Environment from './views/Environment.vue'
import Wisdom from './views/Wisdom.vue'
import Knowledge from './views/Knowledge.vue'
import Family from './views/Family.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
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
    path: '/environment',
    name: 'Environment',
    component: Environment
  },
  {
    path: '/wisdom',
    name: 'Wisdom',
    component: Wisdom
  },
  {
    path: '/knowledge',
    name: 'Knowledge',
    component: Knowledge
  },
  {
    path: '/family',
    name: 'Family',
    component: Family
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
