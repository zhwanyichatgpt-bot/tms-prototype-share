import { reactive } from 'vue'
import { cargos } from './cargo-data.js'
import { totals, validateSnapshot } from './cargo-quote-model.js'

const key = 'lianyun-cargo-preview-v1'
const validId = id => cargos.some(cargo => cargo.id === id)
let initial = {}
try { initial = JSON.parse(localStorage.getItem(key) || '{}') || {} } catch { /* 本机记录不可读时保留可用的空状态。 */ }
const units = ['元/票', '元/吨', '元/箱']
const validQuote = quote => quote && validId(quote.cargoId) && Number.isFinite(quote.amount) && quote.amount > 0 && quote.amount <= 100000000 && units.includes(quote.unit) && typeof quote.fees === 'string' && typeof quote.duration === 'string' && (!quote.snapshot || (quote.snapshot.source?.id===quote.cargoId && validateSnapshot(quote.snapshot) && Math.abs(totals(quote.snapshot.source,quote.snapshot.form).total-quote.amount)<0.001))
export const cargoStore = reactive({
  favorites: Array.isArray(initial.favorites) ? [...new Set(initial.favorites.filter(validId))] : [],
  quotes: Array.isArray(initial.quotes) ? initial.quotes.filter(validQuote).slice(0, 100) : [],
  storageError: false
})
function persist() {
  try { localStorage.setItem(key, JSON.stringify({ favorites: cargoStore.favorites, quotes: cargoStore.quotes })); cargoStore.storageError = false }
  catch { cargoStore.storageError = true }
}
export function toggleCargoFavorite(id) {
  if (!validId(id)) return false
  const saved = !cargoStore.favorites.includes(id)
  cargoStore.favorites = saved ? [...cargoStore.favorites, id] : cargoStore.favorites.filter(item => item !== id)
  persist()
  return saved
}
export function saveCargoQuote(quote) {
  if (!validQuote(quote) || !quote.fees.trim() || (!quote.snapshot && !quote.duration.trim())) return false
  cargoStore.quotes = [{ ...JSON.parse(JSON.stringify(quote)), status:'已报价', fees: quote.fees.trim().slice(0, 500), duration: quote.duration.trim().slice(0, 100), submittedAt: new Date().toISOString() }, ...cargoStore.quotes.filter(item => item.cargoId !== quote.cargoId)]
  persist()
  return true
}
