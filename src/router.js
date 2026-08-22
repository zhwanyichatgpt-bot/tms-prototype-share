import { createRouter, createWebHistory } from 'vue-router'
import { pages } from './page-registry'
import { buildPrototypeCatalogPath, getRouteDecision } from './review/review-ui-policy.mjs'

const EmptyRouteView = { render: () => null }

const routes = [
  {
    path: '/',
    name: 'reviewEntry',
    component: EmptyRouteView,
    meta: { view: 'entry' },
    beforeEnter: () => getRouteDecision('root', import.meta.env.DEV) === 'manage'
      ? { name: 'versionManage' }
      : true,
  },
  {
    path: '/manage/versions',
    name: 'versionManage',
    component: EmptyRouteView,
    meta: { view: 'manage' },
    beforeEnter: () => getRouteDecision('manage', import.meta.env.DEV) === 'root'
      ? { name: 'reviewEntry' }
      : true,
  },
  {
    path: buildPrototypeCatalogPath(),
    name: 'prototypeCatalog',
    component: EmptyRouteView,
    meta: { pageKey: 'home', view: 'legacy' },
    beforeEnter: () => getRouteDecision('prototypeCatalog', import.meta.env.DEV) === 'root'
      ? { name: 'reviewEntry' }
      : true,
  },
  {
    path: '/review/:versionId',
    name: 'versionReview',
    component: EmptyRouteView,
    meta: { view: 'reviewPrototype' },
  },
  {
    path: '/review/:versionId/:pageKey',
    name: 'versionPrototype',
    component: EmptyRouteView,
    meta: { view: 'reviewPrototype' },
  },
  ...pages.map((page) => ({
    path: `/${page.key}`,
    name: page.key,
    component: EmptyRouteView,
    meta: { pageKey: page.key, view: 'legacy' },
    beforeEnter: () => getRouteDecision('legacy', import.meta.env.DEV) === 'root'
      ? { name: 'reviewEntry' }
      : true,
  })),
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'reviewEntry' },
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
