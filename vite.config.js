import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { annotationPlugin } from './viteAnnotationPlugin'

export default defineConfig({
  plugins: [annotationPlugin(), vue()],
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
    port: 5173,
    open: true
  },
  base: '/'
})
