function safeSegment(value) {
  const segment = String(value || '')
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(segment)) {
    throw new Error('路径标识只允许英文、数字、下划线和连字符')
  }
  return segment
}

export function annotationRelativePath({ versionId = null, pageKey }) {
  const safePageKey = safeSegment(pageKey)
  if (!versionId) return `annotations/${safePageKey}.json`
  const safeVersionId = safeSegment(versionId)
  return `review-data/versions/${safeVersionId}/annotations/${safePageKey}.json`
}

export function annotationLoadUrl({ baseUrl = '/', versionId = null, pageKey }) {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${normalizedBase}${annotationRelativePath({ versionId, pageKey })}`
}
