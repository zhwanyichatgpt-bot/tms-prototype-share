<script setup>
/** 运单详情中的实际箱清单：只读，按本运单的装卸路段查看。 */
import { computed, ref, watch } from 'vue'

const props = defineProps({
  manifest: { type: Object, required: true },
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])
const activeGroup = ref('')
const keyword = ref('')
const page = ref(1)
const pageSize = 10
const groups = computed(() => props.manifest.groups || [])
const allBoxes = computed(() => groups.value.flatMap(group => group.boxes.map(box => ({ ...box, groupKey: group.key, route: `${group.from} → ${group.to}` }))))
const selectedGroup = computed(() => groups.value.find(group => group.key === activeGroup.value))
const visibleBoxes = computed(() => {
  const source = activeGroup.value ? allBoxes.value.filter(box => box.groupKey === activeGroup.value) : allBoxes.value
  const query = keyword.value.trim().toLowerCase()
  return query ? source.filter(box => box.no.toLowerCase().includes(query) || box.seal.toLowerCase().includes(query)) : source
})
const pageCount = computed(() => Math.max(1, Math.ceil(visibleBoxes.value.length / pageSize)))
const pageBoxes = computed(() => visibleBoxes.value.slice((page.value - 1) * pageSize, page.value * pageSize))
watch([keyword, activeGroup], () => { page.value = 1 })
watch(() => props.manifest, () => { activeGroup.value = ''; keyword.value = ''; page.value = 1 })
watch(() => props.open, (open) => { if (open) { activeGroup.value = ''; keyword.value = ''; page.value = 1 } })
function closeList() { emit('close') }
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="wd-manifest-mask" @click.self="closeList">
      <aside class="wd-manifest-drawer" role="dialog" aria-modal="true" aria-label="实际箱清单">
        <div class="wd-manifest-header"><div><h2>实际箱清单</h2><p>{{ selectedGroup ? `${selectedGroup.from} → ${selectedGroup.to}` : '本运单全部路段' }} · 共 {{ visibleBoxes.length }} 箱</p></div><button type="button" class="wd-manifest-close" aria-label="关闭箱清单" @click="closeList">×</button></div>
        <div class="wd-manifest-filters">
          <select v-model="activeGroup" aria-label="选择装卸路段"><option value="">全部路段</option><option v-for="group in groups" :key="group.key" :value="group.key">{{ group.from }} → {{ group.to }}</option></select>
          <input v-model="keyword" type="search" placeholder="搜索箱号或铅封号" aria-label="搜索箱号或铅封号" />
        </div>
        <div class="wd-manifest-list">
          <table class="wd-container-table">
            <thead><tr><th>箱号</th><th>装点 → 卸点</th><th>箱型</th><th>货品</th><th v-if="manifest.mode === 'rail'">车皮号</th><th>铅封号</th><th>实际重量（吨）</th><th>状态</th></tr></thead>
            <tbody><tr v-for="box in pageBoxes" :key="box.no"><td class="wd-container-no">{{ box.no }}</td><td>{{ box.route }}</td><td>{{ box.size }}</td><td>{{ box.cargo }}</td><td v-if="manifest.mode === 'rail'">{{ box.wagon }}</td><td>{{ box.seal }}</td><td>{{ box.weight }}</td><td><span class="wd-container-status">{{ box.status }}</span></td></tr></tbody>
          </table>
          <div v-if="!pageBoxes.length" class="wd-manifest-empty">没有匹配的箱号</div>
        </div>
        <div class="wd-manifest-pagination"><span>共 {{ visibleBoxes.length }} 箱 · 第 {{ page }} / {{ pageCount }} 页</span><button type="button" :disabled="page <= 1" @click="page--">上一页</button><button type="button" :disabled="page >= pageCount" @click="page++">下一页</button></div>
      </aside>
    </div>
  </Teleport>
</template>
