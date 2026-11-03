// 货源业务方式与当前企业参与状态分开；履约统一由托运订单承接。
import { cargoStore } from './cargo-store.js'
import { cargoGrabStore,cargoGrabBadge } from './cargo-grab-store.js'
import { cargoDiscoverable,isGrabCargo } from './cargo-grab-model.js'
export function cargoParticipationLabel(cargo){return isGrabCargo(cargo)?cargoGrabBadge(cargo):cargoStore.quotes.some(row=>row.cargoId===cargo.id)?'已报价':'报价'}
export function visibleInCargoDiscovery(cargo){return cargoDiscoverable(cargo,cargoGrabStore.records.find(row=>row.cargoId===cargo.id))}
