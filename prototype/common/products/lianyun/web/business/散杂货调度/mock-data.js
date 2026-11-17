import { transportModes } from "./transport-mode.js";

export const assetRoot = "/bulk-dispatch-assets/";

export function createPlans(mode) {
  const labels = transportModes[mode];
  return Array.from({ length: 10 }, (_, index) => ({
    id: `${mode}-plan-${index + 1}`,
    number: index + 1,
    name: mode === "road" && index ? `${labels.planName}（${index + 1}）` : labels.planName,
    enterprise: "福建万维宇宙科技有限公司",
    transport: labels.transport,
    mode: labels.businessTypes[index === 0 || index === 2 ? 0 : 1],
    freight: mode === "road" ? "1680.00" : "3771.00",
    loading: "2023-03-04 17:34",
    unloading: "2023-03-06 17:34",
    driverRate: mode === "road" ? {
      condition: index % 2 === 0 ? "按装货" : "按卸货",
      basis: "吨数",
      unitPrice: index % 2 === 0 ? 30 : 35,
    } : undefined,
    salesperson: "小张",
    status: index < 8 ? "待执行" : index === 8 ? "执行中" : "已执行",
  }));
}

export const metricItems = [
  { label: "待调度", value: "21" },
  { label: "调度中", value: "11" },
  { label: "待调度货量（吨）", value: "2460", change: "+1203" },
  { label: "完成货量（吨）", value: "3460", change: "+1203" },
  { label: "在途运单", value: "300", change: "+10" },
  { label: "完成运单", value: "300", change: "-10" },
  { label: "异常运单", value: "3" },
];

export function createRouteStops(mode = "water") {
  const labels = transportModes[mode];
  return Array.from({ length: 10 }, (_, index) => ({
    id: `stop-${index + 1}`,
    routeOrder: index,
    mapPosition: [
      [330, 670],
      [787, 550],
      [1010, 485],
      [962, 342],
      [802, 371],
      [113, 541],
      [684, 421],
      [581, 249],
      [897, 781],
      [256, 606],
    ][index],
    name: labels.locationName,
    planName: labels.planName,
    kind: index > 1 ? "unload" : "load",
    selected: index < 5,
    expanded: index < 2,
    network: index === 0 || index === 2,
    address: labels.address,
    arrival: "2023-12-14 00:00",
    departure: "2023-12-14 00:00",
    plans: index === 0 ? ["不允许拼车", "允许拼车"] : ["允许拼车"],
    loading: index === 0 ? ["可口可乐"] : ["可口可乐", "百事可乐"],
    unloading: index === 1 ? ["可口可乐", "百事可乐", "百事可乐"] : [],
  }));
}

export function createRoadPlanStops(plans) {
  const examples = createRouteStops("road");
  const places = {
    load: ["福州物流园", "青口集货点", "长乐配货站"],
    unload: ["莆田配送中心", "涵江卸货仓", "秀屿物流园"],
  };
  return ["load", "unload"].flatMap((kind, stage) => plans.map((plan) => {
    const index = plan.number - 1;
    const example = examples[(index * 2 + stage) % examples.length];
    return {
      ...example,
      id: `${plan.id}-${kind}`,
      planId: plan.id,
      planName: plan.name,
      name: places[kind][index % places[kind].length],
      address: places[kind][index % places[kind].length],
      routeOrder: stage * 100 + index,
      kind,
      selected: true,
      loading: kind === "load" ? example.loading : [],
      unloading: kind === "unload" ? ["可口可乐"] : [],
    };
  }));
}

export function createVessel(index = 0, expanded = true, mode = "water") {
  const labels = transportModes[mode];
  return {
    id: crypto.randomUUID(),
    ship: labels.assetNumbers[index % 2],
    owner: labels.ownerName,
    weight: "",
    volume: "",
    quantity: "",
    frequency: "每日",
    trips: "",
    billing: index % 2 === 0 ? "模板计费" : "单位计费",
    template: "",
    condition: "",
    basis: "",
    unitPrice: "",
    expanded,
  };
}

export function createPeriods(mode = "water") {
  return [
    {
      id: crypto.randomUUID(),
      start: "2024-12-10T00:00",
      end: "2024-12-10T23:59",
      vessels: [
        createVessel(0, true, mode),
        createVessel(1, true, mode),
        ...Array.from({ length: 8 }, (_, index) => ({
          ...createVessel(index + 2, true, mode),
          ship: "",
          owner: "",
          placeholder: true,
          frequency: index % 2 === 0 ? "每日" : "不限",
        })),
      ],
    },
    ...(mode === "road" ? [] : [{
      id: crypto.randomUUID(),
      start: "2024-12-10T00:00",
      end: "2024-12-10T23:59",
      vessels: [{ ...createVessel(2, false, mode), ship: "", owner: "" }],
    }]),
  ];
}

export function createRecords(count = 10, mode = "water") {
  const labels = transportModes[mode];
  return Array.from({ length: count }, (_, index) => ({
    id: `${mode}-record-${index + 1}`,
    number: index <= 10 ? "YD12313121312" : `YD${12313121312 + index}`,
    listNumber: index <= 10 ? "DD12313121312" : `DD${12313121312 + index}`,
    creator: "小明",
    created: "2024-12-29 10:10:30",
    valid: index === 0 || index > 2,
    expanded: index === 0 || index === 10,
    transport: labels.transport,
    progress: 50,
    tasks: Array.from({ length: 4 }, (_, taskIndex) => ({
      id: `task-${index}-${taskIndex}`,
      number: "20151111212112",
      kind: taskIndex === 2 ? "委外调度" : "内部调度",
      owner: `${labels.ownerName} | 17844442424`,
      enterprise: "融合TMS运输企业",
      valid: true,
    })),
  }));
}

export const billingUnits = { 吨数: "吨", 数量: "件", 体积: "m³" };

export function getRoadBillingSegments(stops, plans) {
  const selected = stops.filter((stop) => stop.selected);
  return selected.flatMap((load, loadIndex) => {
    if (load.kind !== "load" || !load.planId) return [];
    const unload = selected.slice(loadIndex + 1)
      .find((stop) => stop.kind === "unload" && stop.planId === load.planId);
    if (!unload) return [];
    const plan = plans.find((item) => item.id === load.planId);
    return [{
      id: load.id,
      planId: load.planId,
      planName: load.planName,
      load: load.name,
      unload: unload.name,
      unloadId: unload.id,
      rule: plan?.driverRate,
    }];
  });
}

export function getSegmentFreight(segment, quantity) {
  if (!segment.rule || quantity === undefined || quantity === "" || !Number.isFinite(Number(quantity)) || Number(quantity) < 0) return null;
  return Math.round(Number(quantity) * segment.rule.unitPrice * 100) / 100;
}

export function getVesselFreight(vessel, billingScope, segments = []) {
  if (billingScope === "segment") {
    const amounts = segments.map((segment) => getSegmentFreight(segment, vessel.segmentQuantities?.[segment.id]));
    return amounts.length && amounts.every((amount) => amount !== null)
      ? amounts.reduce((sum, amount) => sum + amount, 0)
      : null;
  }
  if (vessel.billing === "模板计费") return vessel.template ? 3000 : 0;
  const amount = {
    吨数: vessel.weight,
    数量: vessel.quantity,
    体积: vessel.volume,
  }[vessel.basis];
  return (Number(amount) || 0) * (Number(vessel.unitPrice) || 0);
}

export function getVesselTotal(vessel, billingScope, segments) {
  if (vessel.frequency === "不限") return null;
  const freight = getVesselFreight(vessel, billingScope, segments);
  if (freight === null || (billingScope === "segment" && !Number(vessel.trips))) return null;
  return freight * (Number(vessel.trips) || 0);
}

export const mapPoints = {
  plan: [
    [10.5, 178, "load"],
    [90, 187, "load"],
    [180, 337, "load"],
    [279, 366, "load"],
    [40, 276, "unload"],
    [344, 262, "unload"],
    [82, 404, "inactive"],
    [182, 219, "inactive"],
    [265, 70, "inactive"],
    [204, 443, "inactive-unload"],
    [308, 167, "inactive-unload"],
  ],
  record: [
    [40.5, 26, "load"],
    [167, 41, "unload"],
    [413, 193, "unload"],
    [237, 67, "load"],
    [103.5, 48, "waypoint"],
    [315.5, 72, "waypoint"],
  ],
  planning: [
    [113, 541, "inactive"],
    [684, 421, "inactive"],
    [581, 249, "inactive"],
    [897, 781, "inactive"],
    [802, 371, "inactive"],
    [256, 606, "inactive-unload"],
    [391, 705, "inactive-unload"],
    [654, 729, "inactive-unload"],
    [788, 677, "inactive-unload"],
    [1010, 729, "inactive-unload"],
    [962, 342, "unload", "200.02 公里"],
    [787, 550, "unload", "150.02 公里"],
    [330, 670, "load", "80.12 公里"],
    [1010, 485, "load", "180.02 公里"],
  ],
  detail: [
    [530, 417, "inactive"],
    [545, 223, "load"],
    [929, 297, "inactive"],
    [501, 482, "inactive"],
    [1033, 553, "inactive"],
    [1264, 609, "inactive"],
    [1032, 426, "unload", "150.02 公里"],
    [807, 496, "unload", "120.02 公里"],
    [530, 355, "unload", "44.24 公里"],
    [575, 546, "load", "80.12 公里"],
    [1255, 361, "load", "160.02 公里"],
    [959, 492, "load", "140.02 公里"],
    [1207, 218, "unload", "200.02 公里"],
    [435, 279, "waypoint", "20.14 公里"],
    [551, 428, "waypoint", "60.12 公里"],
  ],
};
