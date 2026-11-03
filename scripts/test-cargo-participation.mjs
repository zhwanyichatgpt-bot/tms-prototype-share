// 以独立内存模拟刷新前保存的首页报价，验证动态首页货源未登记前也能恢复参与标记。
import assert from 'node:assert/strict'
const memory=new Map([['lianyun-cargo-preview-v1',JSON.stringify({favorites:['home-design-cargo-0'],quotes:[{cargoId:'home-design-cargo-0',amount:3600,unit:'元/票',fees:'含运输',duration:'1天'}]})]])
globalThis.localStorage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)}
const {cargoStore}=await import('../prototype/common/products/lianyun/mobile/货主端首页/cargo-store.js')
const {cargoParticipationLabel,visibleInCargoDiscovery}=await import('../prototype/common/products/lianyun/mobile/货主端首页/cargo-participation.js')
assert.equal(cargoStore.quotes.length,1);assert.equal(cargoStore.favorites.length,1)
assert.equal(cargoParticipationLabel({id:'home-design-cargo-0',publishMode:'报价'}),'已报价')
assert(visibleInCargoDiscovery({id:'home-design-cargo-0',publishMode:'报价'}))
assert.equal(cargoParticipationLabel({id:'unquoted',publishMode:'报价'}),'报价')
assert(!visibleInCargoDiscovery({id:'taken',publishMode:'抢单',grabAvailability:'taken'}))
console.log('通过：已报价标记、报价仍可展示、未报价标记、抢完隐藏、首页报价与收藏刷新恢复')
