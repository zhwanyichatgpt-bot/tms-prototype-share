/**
 * 运输任务 —— 状态 / 标签 / 展示映射
 * 状态颜色、可用操作、展示规则统一收敛于此，模板不再复制多套条件。
 */

export const STATUS_STYLES = {
  todo: { label: '待执行', color: '#3a65ff', border: '#3a65ff', background: '#f0f3ff' },
  running: { label: '运输中', color: '#3a65ff', border: '#3a65ff', background: '#f0f3ff' },
  done: { label: '已完成', color: '#20be8d', border: '#20be8d', background: '#ecfff8' },
  paused: { label: '已暂停', color: '#ff9d18', border: '#ff9d18', background: '#fff7e8' },
  stopped: { label: '已终止', color: '#8f8f8f', border: '#9b9b9b', background: '#f4f4f4' },
  void: { label: '已作废', color: '#8f8f8f', border: '#9b9b9b', background: '#f4f4f4' },
}

const STATUS_KEY_BY_LABEL = Object.fromEntries(
  Object.entries(STATUS_STYLES).map(([key, value]) => [value.label, key]),
)

export function statusKey(status) {
  return STATUS_STYLES[status] ? status : (STATUS_KEY_BY_LABEL[status] ?? status)
}

export function statusLabel(status) {
  return STATUS_STYLES[statusKey(status)]?.label ?? status
}

export function statusStyle(status) {
  return STATUS_STYLES[statusKey(status)] ?? STATUS_STYLES.todo
}

/** 任务头部操作：当前画板中的主任务和折叠任务均展示三个入口。 */
export function headerActions() {
  return [
    { key: 'assign', label: '任务指派' },
    { key: 'pause', label: '暂停' },
    { key: 'detail', label: '详情' },
  ]
}

/** 折叠卡 header 标签：调度类型 + 运输方式 + 装卸类型 统一拼为一个标签序列 */
export function headerTagList(task) {
  const list = []
  if (task.tags?.schedule) list.push({ text: task.tags.schedule })
  ;(task.tags?.transports || []).forEach(text => list.push({ text }))
  ;(task.tags?.loads || []).forEach(text => list.push({ text }))
  return list
}
