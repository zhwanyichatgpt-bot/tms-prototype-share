import { reactive } from 'vue'

// 地址簿与常用联系人的原型示例数据；新增、编辑、删除只写入本机 localStorage。
const key = 'lianyun-shipper-directory-v2'

const seedAddresses = [
  { id: 'addr-1', name: '宁波北仑工厂', type: '装货', region: '浙江省 宁波市 北仑区', detail: '明州路 168 号 3 幢', contact: '张建国', phone: '13800138000', isDefault: true },
  { id: 'addr-2', name: '宁波港北仑港区', type: '装货', region: '浙江省 宁波市 北仑区', detail: '迎宾路 16 号', contact: '李海峰', phone: '13912345678', isDefault: false },
  { id: 'addr-3', name: '上海外高桥仓库', type: '卸货', region: '上海市 浦东新区', detail: '洲海路 999 号', contact: '王敏', phone: '13755556666', isDefault: false },
  { id: 'addr-4', name: '苏州工业园区厂区', type: '装货', region: '江苏省 苏州市 吴中区', detail: '星湖街 328 号', contact: '陈晓东', phone: '13688889999', isDefault: false },
  { id: 'addr-5', name: '杭州萧山配送中心', type: '卸货', region: '浙江省 杭州市 萧山区', detail: '通惠北路 28 号', contact: '赵磊', phone: '13566667777', isDefault: false },
  { id: 'addr-6', name: '无锡惠山客户仓', type: '卸货', region: '江苏省 无锡市 惠山区', detail: '堰新路 18 号', contact: '周婷', phone: '13433334444', isDefault: false },
]

const seedContacts = [
  { id: 'contact-1', name: '张建国', role: '总经办 · 企业管理员', phone: '13800138000', tag: '常用对接', note: '企业默认对接人' },
  { id: 'contact-2', name: '李海峰', role: '物流部 · 物流经理', phone: '13912345678', tag: '最近联系', note: '负责宁波工厂发货' },
  { id: 'contact-3', name: '王敏', role: '仓储部 · 收货主管', phone: '13755556666', tag: '', note: '上海仓库收货对接' },
  { id: 'contact-4', name: '陈晓东', role: '采购部 · 采购专员', phone: '13688889999', tag: '', note: '' },
  { id: 'contact-5', name: '赵磊', role: '运营部 · 调度主管', phone: '13566667777', tag: '调度对接', note: '负责宁波港区提货调度' },
  { id: 'contact-6', name: '周婷', role: '客服部 · 客户经理', phone: '13433334444', tag: '常用对接', note: '负责无锡客户仓对接' },
]

function readStored() {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const stored = readStored()
const storedAddresses = Array.isArray(stored?.addresses) ? stored.addresses : null
const storedContacts = Array.isArray(stored?.contacts) ? stored.contacts : null
const seedContactById = new Map(seedContacts.map(item => [item.id, item]))

export const addressBookStore = reactive({
  addresses: (storedAddresses || seedAddresses).map(item => ({ ...item })),
  // 兼容本次改版前留在本机的联系人数据，补齐 Pixso 联系人行使用的标签字段。
  contacts: (storedContacts || seedContacts).map(item => ({
    ...item,
    tag: item.tag ?? seedContactById.get(item.id)?.tag ?? '',
  })),
})

function persist() {
  try {
    localStorage.setItem(key, JSON.stringify({
      addresses: addressBookStore.addresses,
      contacts: addressBookStore.contacts,
    }))
  } catch {
    // 原型演示在本机存储不可用时仍保留当前会话内的修改。
  }
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function saveAddress(input) {
  const record = {
    id: input.id || makeId('addr'),
    name: String(input.name || '').trim(),
    type: input.type === '卸货' ? '卸货' : '装货',
    region: String(input.region || '').trim(),
    detail: String(input.detail || '').trim(),
    contact: String(input.contact || '').trim(),
    phone: String(input.phone || '').trim(),
    isDefault: !!input.isDefault || !addressBookStore.addresses.length,
  }
  if (record.isDefault) addressBookStore.addresses.forEach(item => { item.isDefault = false })
  const index = addressBookStore.addresses.findIndex(item => item.id === record.id)
  if (index >= 0) addressBookStore.addresses.splice(index, 1, { ...addressBookStore.addresses[index], ...record })
  else addressBookStore.addresses.unshift(record)
  if (!addressBookStore.addresses.some(item => item.isDefault)) addressBookStore.addresses[0].isDefault = true
  persist()
  return record
}

export function removeAddress(id) {
  const index = addressBookStore.addresses.findIndex(item => item.id === id)
  if (index < 0) return
  addressBookStore.addresses.splice(index, 1)
  if (addressBookStore.addresses.length && !addressBookStore.addresses.some(item => item.isDefault)) {
    addressBookStore.addresses[0].isDefault = true
  }
  persist()
}

export function setDefaultAddress(id) {
  if (!addressBookStore.addresses.some(item => item.id === id)) return
  addressBookStore.addresses.forEach(item => { item.isDefault = item.id === id })
  persist()
}

export function saveContact(input) {
  const record = {
    id: input.id || makeId('contact'),
    name: String(input.name || '').trim(),
    role: String(input.role || '').trim(),
    phone: String(input.phone || '').trim(),
    tag: String(input.tag || '').trim(),
    note: String(input.note || '').trim(),
  }
  const index = addressBookStore.contacts.findIndex(item => item.id === record.id)
  if (index >= 0) addressBookStore.contacts.splice(index, 1, { ...addressBookStore.contacts[index], ...record })
  else addressBookStore.contacts.unshift(record)
  persist()
  return record
}

export function removeContact(id) {
  const index = addressBookStore.contacts.findIndex(item => item.id === id)
  if (index < 0) return
  addressBookStore.contacts.splice(index, 1)
  persist()
}
