// 联运个人中心的独立示例数据；账户、付款和发票摘要不代表真实资金或开票资格。
export const mineProfile = {
  name: '张建国',
  enterpriseName: '浙江恒远制造有限公司',
  avatar: '/zhiyun-mobile-assets/mine/avatar.png',
  certification: '已认证',
}

export const mineAccountSummary = {
  availableBalance: 8000,
  frozenAmount: 6000,
}

export const minePaymentSummary = {
  pendingAmount: 15000,
  pendingCount: 3,
  processingCount: 1,
}

export const mineInvoiceSummary = {
  availableAmount: 7660,
  availableCount: 9,
  processingCount: 1,
}

export const minePersonalSummary = {
  recentCount: 6,
  reviewCount: 3,
  routeCount: 2,
  addressCount: 6,
  contactCount: 4,
}

// 待办与未读消息为独立示例数量，不从「等待供应方回复」等状态累加。
export const mineInboxSummary = {
  todoCount: 2,
  unreadCount: 3,
}

export const mineSupportMenus = [
  { key: 'service', label: '联系客服', icon: 'service-o' },
  { key: 'feedback', label: '我的反馈与投诉', icon: 'comment-circle-o' },
  { key: 'rules', label: '平台规则', icon: 'records-o' },
  { key: 'settings', label: '设置', icon: 'setting-o' },
]

export function formatMineAmount(value) {
  const amount = Number(value)
  return (Number.isFinite(amount) ? amount : 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
