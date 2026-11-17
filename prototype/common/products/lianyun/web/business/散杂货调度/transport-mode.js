import { inject } from "vue";

export const transportModes = {
  road: {
    key: "road",
    tab: "汽运计划",
    transport: "公路运输",
    businessTypes: ["整车运输", "零担运输"],
    planName: "4月10日福州-莆田公路运输计划",
    locationName: "福州物流园",
    address: "福建省福州市仓山区南江滨西大道福州物流园",
    arrival: "到场",
    departure: "离场",
    cargoLoading: "装车货品",
    cargoUnloading: "卸车货品",
    asset: "车辆",
    assetType: "厢式货车",
    assetUnit: "车",
    owner: "司机",
    ownerField: "驾驶司机",
    ownerName: "张师傅",
    assetNumbers: ["闽A·62835", "闽A·90321"],
    marker: "/multimodal-plan-assets/road.svg",
    mapNumber: "闽A·62835",
  },
  water: {
    key: "water",
    tab: "水路计划",
    transport: "水路运输",
    businessTypes: ["整船运输", "拼船运输"],
    planName: "4月10日马尾-江阴运输计划",
    locationName: "盛狮江阴",
    address: "福建省福州市仓山区南社二路与南江滨西大道交叉口西南角",
    arrival: "抵港",
    departure: "离港",
    cargoLoading: "装船货品",
    cargoUnloading: "卸船货品",
    asset: "船舶",
    assetType: "干货船",
    assetUnit: "船",
    owner: "船东",
    ownerField: "驾驶船东",
    ownerName: "林森森",
    assetNumbers: ["闽A12345", "闽A33333"],
    marker: "/bulk-dispatch-assets/ship.png",
    mapNumber: "船A12345",
  },
};

export const dispatchModeKey = Symbol("dispatch-mode");
export function useDispatchMode() {
  return inject(dispatchModeKey);
}
