import { reactive } from 'vue'
const key = 'tms.zhixiaojian.entry.v1'
let saved = {}
try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {} } catch { /* 存储不可用时保留会话设置。 */ }
export const entryPreferences = reactive({ floatingVisible: saved.floatingVisible !== false, introSeen: saved.introSeen === true, dismissedAnnouncements: Array.isArray(saved.dismissedAnnouncements) ? saved.dismissedAnnouncements : [] })
function save() { try { localStorage.setItem(key, JSON.stringify(entryPreferences)) } catch { /* 不阻断当前交互。 */ } }
export function setFloatingVisible(value) { entryPreferences.floatingVisible = value; save() }
export function dismissEntryIntro() { entryPreferences.introSeen = true; save() }

export function dismissAnnouncement(id) { if (!entryPreferences.dismissedAnnouncements.includes(id)) entryPreferences.dismissedAnnouncements.push(id); save() }
