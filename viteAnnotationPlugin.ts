import type { Plugin } from 'vite'
import { AnnotationSaveError, createAnnotationSaveService } from './review/annotation-save-service.mjs'

/**
 * Vite 插件：标注数据本地保存
 * 拦截 /__annotation_save__ 请求，将标注 JSON 写入 public/annotations/ 目录
 * 仅在 dev server 生效，不影响生产构建
 */
export function annotationPlugin(): Plugin {
  let projectRoot = ''
  const MAX_BODY = 1024 * 1024 // 请求体上限 1MB，防止内存耗尽

  return {
    name: 'vite-plugin-annotation-save',
    configResolved(config) {
      projectRoot = config.root
    },
    configureServer(server) {
      const saveService = createAnnotationSaveService({ projectRoot })
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'POST' || !req.url?.includes('/__annotation_save__')) {
          return next()
        }

        let body = ''
        let aborted = false
        req.on('data', (chunk) => {
          body += chunk
          if (Buffer.byteLength(body, 'utf8') > MAX_BODY) {
            aborted = true
            res.statusCode = 413
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: '请求体过大' }))
            req.destroy()
          }
        })
        req.on('end', async () => {
          if (aborted) return
          try {
            const data = JSON.parse(body)
            const result = await saveService.save(data)

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, file: result.file }))
          } catch (e) {
            const error = e as AnnotationSaveError
            const known = error instanceof AnnotationSaveError
            if (!known && !(e instanceof SyntaxError)) {
              console.error('[annotation-plugin] 保存失败:', e)
            }
            res.statusCode = e instanceof SyntaxError ? 400 : known ? error.status : 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              ok: false,
              code: e instanceof SyntaxError ? 'INVALID_JSON' : known ? error.code : 'ANNOTATION_SAVE_FAILED',
              error: e instanceof SyntaxError ? '请求体必须是有效 JSON' : known ? error.message : '保存失败'
            }))
          }
        })
      })
    }
  }
}
