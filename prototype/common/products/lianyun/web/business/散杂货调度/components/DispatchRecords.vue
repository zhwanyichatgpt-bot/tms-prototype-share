<script setup>
import { computed, reactive, ref, watch } from "vue";
import ProgressBlock from "./ProgressBlock.vue";
const props = defineProps({
  records: Array,
  initialPage: { type: Number, default: 2 },
});
const emit = defineEmits(["back", "detail", "assign", "invalidate", "edit"]);
const filters = reactive({ query: "", creator: "", start: "", end: "" });
const applied = ref({});
const page = ref(props.initialPage);
const pageSize = ref("10");
const tooltip = ref(null);
const filteredRecords = computed(() =>
  props.records.filter((record) => {
    const filter = applied.value;
    return (
      (!filter.query ||
        `${record.number}${record.listNumber}`.includes(filter.query)) &&
      (!filter.creator || record.creator === filter.creator) &&
      (!filter.start || record.created.replace(" ", "T") >= filter.start) &&
      (!filter.end || record.created.replace(" ", "T") <= filter.end)
    );
  }),
);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(filteredRecords.value.length / Number(pageSize.value))),
);
const visibleRecords = computed(() =>
  filteredRecords.value.slice(
    (page.value - 1) * Number(pageSize.value),
    page.value * Number(pageSize.value),
  ),
);
const pageNumbers = computed(() => [
  ...new Set(
    [1, 2, 3, 4, 5, 6, pageCount.value].filter(
      (value) => value <= pageCount.value,
    ),
  ),
]);
watch(pageSize, () => (page.value = 1));
watch([page, pageCount], () => {
  page.value = Math.min(pageCount.value, Math.max(1, Number(page.value) || 1));
});
function reset() {
  Object.assign(filters, { query: "", creator: "", start: "", end: "" });
  applied.value = {};
  page.value = 1;
}
</script>

<template>
  <main class="dispatch-records-view">
    <nav class="dispatch-breadcrumb">
      <button type="button" @click="emit('back')">调度中心</button><span>›</span
      ><span class="active">调度记录</span
      ><button type="button" class="breadcrumb-back" @click="emit('back')">
        返回
      </button>
    </nav>
    <form
      class="records-filter-bar"
      @submit.prevent="
        applied = { ...filters };
        page = 1;
      "
    >
      <label class="dispatch-search"
        ><span class="search-glyph" /><input
          v-model="filters.query"
          aria-label="搜索调度记录"
          placeholder="输入调度记录号搜索"
      /></label>
      <div class="dispatch-date-range">
        <select aria-label="记录时间类型">
          <option>创建时间</option></select
        ><span>▦</span
        ><input
          v-model="filters.start"
          aria-label="记录开始时间"
          placeholder="请选择开始时间"
          onfocus="this.type = 'datetime-local'"
          onblur="if (!this.value) this.type = 'text';"
        /><span>—</span
        ><input
          v-model="filters.end"
          aria-label="记录结束时间"
          placeholder="请选择结束时间"
          onfocus="this.type = 'datetime-local'"
          onblur="if (!this.value) this.type = 'text';"
        />
      </div>
      <select v-model="filters.creator" aria-label="创建人">
        <option value="">创建人</option>
        <option>小明</option>
      </select>
      <div class="records-filter-actions">
        <button
          type="button"
          aria-label="重置筛选"
          class="dispatch-square-button"
          @click="reset"
        >
          ⟳</button
        ><button type="submit" class="dispatch-primary">搜索</button>
      </div>
    </form>
    <div class="records-list-scroll">
      <article
        v-for="(record, index) in visibleRecords"
        :key="record.id"
        class="dispatch-record-row"
      >
        <header class="record-row-header">
          <button
            type="button"
            class="record-expand"
            :aria-label="`${record.expanded ? '收起' : '展开'}记录 ${index + 1}`"
            :aria-expanded="record.expanded"
            @click="record.expanded = !record.expanded"
          >
            {{ record.expanded ? "▾" : "▸" }}
          </button>
          <span class="record-row-number"
            >{{ record.listNumber }} | {{ record.creator }}</span
          ><span
            class="dispatch-status"
            :class="record.valid ? 'valid' : 'invalid'"
            >{{ record.valid ? "有效" : "无效" }}</span
          >
          <div class="record-quantities">
            <span
              ><sup>{{ record.planIds?.length || 4 }}</sup
              ><small>运输计划</small></span
            ><span
              ><sup>{{ record.stops?.length || 2 }}</sup
              ><small>途经点</small></span
            ><span><sup>2</sup><small>货品</small></span>
          </div>
          <span
            class="dispatch-tag"
            :class="record.transport === '公路运输' ? 'mint' : 'slate'"
            >{{ record.transport }}</span
          >
          <div class="record-mini-progress">
            <span>调度进度&nbsp; {{ record.progress }}%</span>
            <div><i :style="{ width: `${record.progress}%` }" /></div>
          </div>
          <div class="record-mini-progress">
            <span>运输进度&nbsp; {{ record.progress }}%</span>
            <div><i :style="{ width: `${record.progress}%` }" /></div>
          </div>
          <div
            class="record-progress-popover-anchor"
            @mouseenter="tooltip = record.id"
            @mouseleave="tooltip = null"
          >
            <button
              type="button"
              class="record-progress-trigger"
              aria-label="查看装卸进度"
              @click="tooltip = tooltip === record.id ? null : record.id"
            >
              ▤
            </button>
            <div v-if="tooltip === record.id" class="record-progress-popover">
              <ProgressBlock :value="record.progress" />
            </div>
          </div>
          <time>{{ record.created }}</time>
          <div class="record-row-actions">
            <button
              type="button"
              :disabled="!record.valid"
              @click="emit('invalidate', record)"
            >
              作废</button
            ><button type="button" @click="emit('detail', record)">详情</button
            ><button
              type="button"
              :disabled="!record.valid"
              @click="emit('assign', record)"
            >
              调度指派
            </button>
          </div>
        </header>
        <div v-if="record.expanded" class="record-task-list">
          <div
            v-for="(task, taskIndex) in record.tasks"
            :key="task.id"
            class="record-task-row"
          >
            <span>{{ String(taskIndex + 1).padStart(2, "0") }}</span>
            <div>
              <div>
                {{ task.number }}
                <span
                  class="dispatch-status"
                  :class="task.valid ? 'transit' : 'invalid'"
                  >{{ task.valid ? "运输中" : "无效" }}</span
                >
              </div>
              <small>{{ task.owner }}</small>
            </div>
            <span
              class="dispatch-tag"
              :class="task.kind === '委外调度' ? 'slate' : 'purple'"
              >{{ task.kind }}</span
            >
            <div>
              <small>承运企业</small>
              <p>{{ task.enterprise }}</p>
            </div>
            <div>
              <small>分配货量</small>
              <p>
                <span class="cargo-glyph">▣</span> 100件+100吨+体积100m³=300
              </p>
            </div>
            <div>
              <small>指派任务</small>
              <p>2</p>
            </div>
            <div>
              <small>创建时间</small>
              <p>2024-04-04 04:04:04</p>
            </div>
            <div class="record-task-actions">
              <button
                type="button"
                :disabled="!task.valid || !record.valid"
                @click="emit('edit', record)"
              >
                修改</button
              ><button
                type="button"
                :disabled="!task.valid || !record.valid"
                @click="task.valid = false"
              >
                作废
              </button>
            </div>
          </div>
        </div>
      </article>
      <div v-if="!visibleRecords.length" class="dispatch-empty">
        暂无符合条件的调度记录
      </div>
    </div>
    <footer class="dispatch-pagination">
      <span>共{{ filteredRecords.length }}条</span
      ><select v-model="pageSize" aria-label="每页记录数">
        <option value="10">10条/页</option>
        <option value="20">20条/页</option></select
      ><button
        type="button"
        aria-label="上一页"
        @click="page = Math.max(1, page - 1)"
      >
        ‹</button
      ><button
        v-for="item in pageNumbers"
        :key="item"
        type="button"
        :class="{ active: page === item }"
        @click="page = item"
      >
        {{ item }}</button
      ><button
        type="button"
        aria-label="下一页"
        @click="page = Math.min(pageCount, page + 1)"
      >
        ›</button
      ><span>到第</span
      ><input
        v-model.number="page"
        type="number"
        min="1"
        :max="pageCount"
        aria-label="跳转页码"
      /><span>页</span>
    </footer>
  </main>
</template>
