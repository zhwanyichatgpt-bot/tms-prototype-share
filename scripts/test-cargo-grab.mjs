// 抢单回归仅使用内存数据，不读写真实浏览器、企业或远程接口。
import assert from 'node:assert/strict'
import {cargoDiscoverable,createGrabRecord,grabFingerprint,grabPrice,grabState} from '../prototype/common/products/lianyun/mobile/货主端首页/cargo-grab-model.js'
const now=Date.parse('2026-11-03T12:00:00+08:00')
const cargo={id:'grab-test',businessType:'散杂货',publishMode:'抢单',grabAvailability:'open',grabEndsAt:'2026-11-10T18:00:00+08:00',fixedPrice:{unitPrice:35.5,quantity:20,unit:'吨'},fees:'含运费',payment:'月结',requirements:[['包装','袋装']]}
assert.equal(grabPrice(cargo).total,710)
assert.equal(grabState(cargo,null,now),'ready');assert(cargoDiscoverable(cargo,null,now));assert(!cargoDiscoverable({...cargo,grabAvailability:'taken'},null,now));assert(!cargoDiscoverable(cargo,null,Date.parse(cargo.grabEndsAt)));assert(cargoDiscoverable({...cargo,publishMode:'报价'},null,now))
const fingerprint=grabFingerprint(cargo),record=createGrabRecord(cargo,null,fingerprint,now)
assert(!cargoDiscoverable(cargo,record,now));assert.equal(record.status,'待执行');assert.equal(record.price.total,710);assert.equal(grabState(cargo,record,now),'won')
assert.equal(createGrabRecord(cargo,record,fingerprint,now),record)
assert.throws(()=>createGrabRecord({...cargo,grabAvailability:'taken'},null,fingerprint,now),/已被/)
assert.equal(grabState(cargo,null,Date.parse(cargo.grabEndsAt)),'expired')
assert.throws(()=>createGrabRecord(cargo,null,fingerprint,Date.parse(cargo.grabEndsAt)),/截止/)
assert.equal(grabState({...cargo,grabEndsAt:'invalid'},null,now),'unavailable')
assert.throws(()=>createGrabRecord({...cargo,publishMode:'报价'},null,fingerprint,now),/不能抢单/)
assert.throws(()=>createGrabRecord({...cargo,fees:'费用已变化'},null,fingerprint,now),/重新核对/)
assert.throws(()=>createGrabRecord({...cargo,fixedPrice:{...cargo.fixedPrice,unitPrice:40}},null,fingerprint,now),/重新核对/)
const box={...cargo,businessType:'集装箱',fixedPrice:{lines:[{label:'40GP普货',quantity:4,unitPrice:7800},{label:'20GP钢材',quantity:2,unitPrice:5000}]}}
assert.equal(grabPrice(box).total,41200);assert.equal(grabPrice({...box,fixedPrice:{lines:[]}}),null)
assert.equal(grabPrice({...box,fixedPrice:{lines:[{label:'箱',quantity:1.5,unitPrice:7800}]}}),null)
cargo.fixedPrice.unitPrice=100;assert.equal(record.price.total,710);assert.equal(record.snapshot.fixedPrice.unitPrice,35.5)
const memory=new Map();globalThis.localStorage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)}
const {cargoGrabStore,submitCargoGrab}=await import('../prototype/common/products/lianyun/mobile/货主端首页/cargo-grab-store.js')
const future={...cargo,grabEndsAt:'2099-01-01T18:00:00+08:00'}
const [a,b]=await Promise.all([submitCargoGrab(future,grabFingerprint(future)),submitCargoGrab(future,grabFingerprint(future))])
assert.equal(a.id,b.id);assert.equal(cargoGrabStore.records.length,1);assert.equal(JSON.parse([...memory.values()][0])[0].status,'待执行')
console.log('通过：固定价格、按箱逐行汇总、截止边界、已被抢走、报价隔离、价格条件变更、提交幂等、只读快照、本机保存')
