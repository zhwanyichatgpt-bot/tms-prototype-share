import { createRouter, createWebHistory } from 'vue-router'
import { pages } from './page-registry'

const EmptyRouteView = { render: () => null }

const routes = [
  {
    path: '/',
    name: 'home',
    component: EmptyRouteView,
    meta: { pageKey: 'home' },
  },
  ...pages.map((page) => ({
    path: `/${page.key}`,
    name: page.key,
    component: EmptyRouteView,
    meta: { pageKey: page.key },
  })),
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
