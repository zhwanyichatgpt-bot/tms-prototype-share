<template>
  <main class="driver-todo-page" aria-label="待办事项">
    <div class="driver-status todo-status" aria-hidden="true">
      <strong>9:41</strong>
      <span><i class="signal"></i><van-icon name="wifi-o" /><i class="battery"></i></span>
    </div>

    <div class="todo-scroll">
      <header class="todo-header">
        <button type="button" aria-label="返回个人中心" @click="emit('back')"><van-icon name="arrow-left" /></button>
        <h1>待办</h1>
        <span aria-hidden="true"></span>
      </header>

      <!-- 待办只收需要司机做动作的事项；纯告知类属于消息通知，不进本列表 -->
      <p class="todo-intro">以下事项需要你处理，完成后会自动从列表移除。</p>

      <template v-if="groups.length">
        <section v-for="group in groups" :key="group.key" class="todo-group" :aria-label="group.label">
          <div class="todo-group-heading">
            <h2>{{ group.label }}</h2>
            <small>{{ group.items.length }}项</small>
          </div>

          <button
            v-for="item in group.items"
            :key="item.key"
            type="button"
            class="todo-row"
            @click="openItem(item)"
          >
            <i :class="`todo-icon tone-${item.tone}`"><van-icon :name="item.icon" /></i>
            <span class="todo-content">
              <strong>{{ item.title }}</strong>
              <small>{{ item.desc }}</small>
            </span>
            <em class="todo-action">{{ item.actionLabel }}<van-icon name="arrow" /></em>
          </button>
        </section>
      </template>

      <!-- 空态：没有待办时说明状态，不留空白区，也不放无意义的插图 -->
      <section v-else class="todo-empty" aria-label="无待办">
        <van-icon name="passed" />
        <p>暂无待处理事项</p>
        <small>证件到期、审核结果和运单异常会在这里提醒</small>
      </section>

      <!-- 已处理：证件类完成后自动移出，此处仅归档手工完成的运单类事项 -->
      <section v-if="doneList.length" class="todo-done" aria-label="已处理">
        <div class="todo-group-heading">
          <h2>已处理</h2>
          <small>{{ doneList.length }}项</small>
        </div>
        <div v-for="item in doneList" :key="item.key" class="todo-done-row">
          <van-icon name="checked" />
          <span>{{ item.title }}</span>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { showToast } from 'vant'
import { driverActionTodos, driverTodoGroups, completeActionTodo } from './driver-flow-store.js'
import './driver-todo.css'

const emit = defineEmits(['back', 'open-profile'])

const groups = computed(() => driverTodoGroups())
// 证件类待办由证件状态派生，处理完自动消失，因此不进入已处理归档；
// 只有运单与结算类需要人工标记完成，这里展示那些已完成的记录。
const doneList = computed(() => driverActionTodos.filter((item) => item.done))

function openItem(item) {
  if (item.action === 'profile') {
    // 证件类待办的动作在「我的资料」完成，待办页只做入口，不在此处处理
    emit('open-profile', item.focusKey)
    return
  }
  // 申诉与回单尚未建页，原型内先标记完成以验证「完成后离开列表」
  completeActionTodo(item.key)
  showToast(`${item.title} 已处理`)
}
</script>
