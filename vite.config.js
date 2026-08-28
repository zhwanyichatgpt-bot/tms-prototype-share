import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { annotationPlugin } from './viteAnnotationPlugin'
import { reviewAdminPlugin } from './viteReviewPlugin.mjs'

export default defineConfig({
  plugins: [reviewAdminPlugin(), annotationPlugin(), vue()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (
          warning.code === 'INVALID_ANNOTATION' &&
          warning.id?.includes('node_modules/@vueuse/core/')
        ) {
          return
        }

        warn(warning)
      }
    }
  },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    open: true
  },
  base: '/'
})
