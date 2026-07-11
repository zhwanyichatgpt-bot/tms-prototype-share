import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { annotationPlugin } from './vite-annotation-plugin.mjs'

export default defineConfig({
  plugins: [
    annotationPlugin({
      specRoot: 'prototype',
      pages: {
        货主结算: 'public/annotation/shipper-settlement.spec.yaml',
        创建联运计划: 'public/annotation/create-plan.spec.yaml',
      },
    }),
    vue(),
  ],
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
