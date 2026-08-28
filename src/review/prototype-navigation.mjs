/**
 * 原型页面统一导航方法（版本感知）
 *
 * 规则（见 context/project-rules/原型评审与研发版本发布规则.md 第 6.3 节）：
 * - 版本工作台内（当前路由带 versionId）的列表、详情、返回和跨页面操作，
 *   必须使用版本路由 /review/{versionId}/{pageKey}，保留当前 versionId；
 * - 普通原型环境下才使用普通页面路由 /{pageKey}；
 * - 目标页面的 query 参数（如运单 key、页签 tab）必须原样保留。
 *
 * 业务页面不得再直接写死 `/{pageKey}` 作为唯一跳转方式。
 */

/**
 * 计算原型页面跳转目标（纯函数，便于测试）。
 *
 * @param {object} options
 * @param {string|undefined} options.versionId 当前路由 versionId（route.params.versionId）
 * @param {string} options.pageKey 目标页面 key
 * @param {object} [options.query] 需要保留的 query 参数
 * @returns {{name:string, params:object, query:object}} vue-router location 对象
 */
export function resolvePrototypePageLocation({ versionId, pageKey, query = {} }) {
  const normalizedQuery = { ...(query || {}) }
  if (versionId) {
    return {
      name: 'versionPrototype',
      params: { versionId: String(versionId), pageKey },
      query: normalizedQuery,
    }
  }
  return {
    name: pageKey,
    params: {},
    query: normalizedQuery,
  }
}

/**
 * 在组件内跳转到某个原型页面，自动保留版本上下文与 query 参数。
 *
 * 用法（setup 内）：
 *   import { useRoute, useRouter } from 'vue-router'
 *   import { openPrototypePage } from '<相对路径>/prototype-navigation.mjs'
 *   const route = useRoute()
 *   const router = useRouter()
 *   openPrototypePage(router, route, 'waybillCenterDetailBeigang', { key: row.key, tab: 'addressChange' })
 *
 * @param {import('vue-router').Router} router useRouter()
 * @param {import('vue-router').RouteLocationNormalizedLoaded} route useRoute()
 * @param {string} pageKey 目标页面 key
 * @param {object} [query] 需要保留的 query 参数
 * @returns {Promise} router.push 的 Promise
 */
export function openPrototypePage(router, route, pageKey, query = {}) {
  const location = resolvePrototypePageLocation({
    versionId: route?.params?.versionId,
    pageKey,
    query,
  })
  return router.push(location)
}
