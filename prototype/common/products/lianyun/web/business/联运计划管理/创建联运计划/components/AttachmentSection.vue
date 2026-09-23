<script setup>
import { ref } from 'vue'
import { attachments as mockFiles } from '../mock-data'

const files = ref(mockFiles.map(f => ({ ...f })))
function removeFile(i) {
  files.value.splice(i, 1)
}
function addFile() {
  files.value.push({ id: `a${Date.now()}`, name: '新上传文件.PDF', progress: null })
}
</script>

<template>
  <section class="cp-section">
    <h3 class="cp-section-title">附件</h3>
    <div class="cp-upload">
      <div v-for="(f, i) in files" :key="f.id" class="cp-file">
        <span class="cp-file-icon">📄</span>
        <div class="cp-file-info">
          <span class="cp-file-name">{{ f.name }}</span>
          <div v-if="f.progress !== null" class="cp-file-progress">
            <div class="cp-file-bar"><i :style="{ width: f.progress + '%' }"></i></div>
            <span class="cp-file-percent">{{ f.progress }}%</span>
          </div>
        </div>
        <button type="button" class="cp-file-del" @click="removeFile(i)">✕</button>
      </div>
      <button type="button" class="cp-upload-more" @click="addFile">继续上传</button>
    </div>
  </section>
</template>
