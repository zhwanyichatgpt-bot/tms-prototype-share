function withCacheKey(url, cacheKey) {
  return `${url}${url.includes('?') ? '&' : '?'}t=${encodeURIComponent(cacheKey())}`
}

async function parseResponse(response, fallbackMessage) {
  let payload = null
  try {
    payload = await response.json()
  } catch {
    // 统一在下方转换为可展示错误。
  }
  if (!response.ok) {
    throw new Error(payload?.error || fallbackMessage)
  }
  return payload
}

export function createReviewDataClient({
  fetchImpl = globalThis.fetch,
  cacheKey = () => Date.now(),
  dataBase = '/review-data',
  adminBase = '/__review_admin__',
} = {}) {
  async function read(url, fallbackMessage) {
    const response = await fetchImpl(withCacheKey(url, cacheKey), { cache: 'no-store' })
    return parseResponse(response, fallbackMessage)
  }

  async function write(url, method, body) {
    const response = await fetchImpl(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    })
    const payload = await parseResponse(response, '本地版本操作失败')
    return payload.data
  }

  return {
    async getProjects() {
      const payload = await read(`${dataBase}/projects.json`, '项目数据读取失败')
      return payload.projects || []
    },

    async getVersions() {
      const payload = await read(`${dataBase}/index.json`, '版本列表读取失败')
      return payload.versions || []
    },

    async getVersionBundle(versionId) {
      const safeId = encodeURIComponent(versionId)
      const [version, changes] = await Promise.all([
        read(`${dataBase}/versions/${safeId}/version.json`, '研发版本不存在或尚未发布'),
        read(`${dataBase}/versions/${safeId}/changes.json`, '研发版本不存在或尚未发布'),
      ])
      return { version, changes }
    },

    createProject(input) {
      return write(`${adminBase}/projects`, 'POST', input)
    },

    createVersion(input) {
      return write(`${adminBase}/versions`, 'POST', input)
    },

    updateVersion(versionId, patch) {
      return write(`${adminBase}/versions/${encodeURIComponent(versionId)}`, 'PUT', patch)
    },

    createRevision(versionId, input) {
      return write(`${adminBase}/versions/${encodeURIComponent(versionId)}/revisions`, 'POST', input)
    },

    publishVersion(versionId) {
      return write(`${adminBase}/versions/${encodeURIComponent(versionId)}/publish`, 'POST')
    },

    completeVersion(versionId) {
      return write(`${adminBase}/versions/${encodeURIComponent(versionId)}/complete`, 'POST')
    },
  }
}
