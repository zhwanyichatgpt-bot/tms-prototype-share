<template>
  <div class="dispatch-panel">
    <div v-if="dispatchRecords.length === 0" class="dp-empty">
      <span>暂无调度记录</span>
    </div>

    <div v-else class="dp-list">
      <div v-for="(record, idx) in dispatchRecords" :key="idx" class="dp-card">
        <!-- 调度记录头部：车辆 + 状态 + 类型 + 调度编号 -->
        <div class="dp-card-head">
          <span class="dp-vehicle">{{ record.vehicle }}</span>
          <span class="dp-status">{{ record.status }}</span>
          <span class="dp-type">{{ record.type }}</span>
          <span class="dp-dispatch-no">{{ record.dispatchNo }}</span>
        </div>

        <!-- 统计 -->
        <div class="dp-stats">
          <span class="dp-stat">途径点：<b>{{ record.waypointCount }}</b></span>
          <span class="dp-stat">运单：<b>{{ record.waybillCount }}</b></span>
          <span class="dp-stat">货品：<b>{{ record.goodsCount }}</b></span>
        </div>

        <!-- 装卸地址 -->
        <div class="dp-route">
          <div class="dp-route-item">
            <span class="dp-badge load">装</span>
            <div class="dp-route-info">
              <span class="dp-addr">{{ record.loadAddr }}</span>
              <span class="dp-time">{{ record.loadTime }}</span>
            </div>
          </div>
          <div class="dp-route-item">
            <span class="dp-badge unload">卸</span>
            <div class="dp-route-info">
              <span class="dp-addr">{{ record.unloadAddr }}</span>
              <span class="dp-time">{{ record.unloadTime }}</span>
            </div>
          </div>
        </div>

        <!-- 调度企业 -->
        <div class="dp-org">{{ record.org }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  plan: { type: Object, required: true },
})

const mockRecords = [
  { vehicle: 'YD12313121312', status: '待执行', type: '内部调度', dispatchNo: 'DD20240815001', waypointCount: 3, waybillCount: 2, goodsCount: 2, loadAddr: '福建省福州市马尾区xxxxxxxxxxxxxx100号', loadTime: '2023-12-14 00:00', unloadAddr: '福建省福州市马尾区xxxxxxxxxxxxxx100号', unloadTime: '2023-12-14 00:00', org: '这里显示调度企业名称' },
  { vehicle: 'YD12313121313', status: '待执行', type: '内部调度', dispatchNo: 'DD20240815002', waypointCount: 4, waybillCount: 3, goodsCount: 3, loadAddr: '福建省福州市马尾区xxxxxxxxxxxxxx200号', loadTime: '2023-12-15 08:30', unloadAddr: '江苏省无锡市江阴港xxxxxxxxxxxxxxxx', unloadTime: '2023-12-16 18:00', org: '这里显示调度企业名称' },
  { vehicle: 'YD12313121314', status: '执行中', type: '内部调度', dispatchNo: 'DD20240815003', waypointCount: 2, waybillCount: 1, goodsCount: 1, loadAddr: '福建省福州市马尾区xxxxxxxxxxxxxx300号', loadTime: '2023-12-16 09:00', unloadAddr: '浙江省宁波市北仑港xxxxxxxxxxxx', unloadTime: '2023-12-17 12:00', org: '这里显示调度企业名称' },
  { vehicle: 'YD12313121315', status: '已完成', type: '内部调度', dispatchNo: 'DD20240814001', waypointCount: 5, waybillCount: 4, goodsCount: 4, loadAddr: '福建省福州市马尾区xxxxxxxxxxxxxx400号', loadTime: '2023-12-13 07:00', unloadAddr: '上海市宝山区罗泾港xxxxxxxxxxxx', unloadTime: '2023-12-14 20:00', org: '这里显示调度企业名称' },
  { vehicle: 'YD12313121316', status: '待执行', type: '内部调度', dispatchNo: 'DD20240814002', waypointCount: 3, waybillCount: 2, goodsCount: 2, loadAddr: '福建省福州市马尾区xxxxxxxxxxxxxx500号', loadTime: '2023-12-13 10:00', unloadAddr: '江苏省南通市如皋港xxxxxxxxxxxx', unloadTime: '2023-12-15 16:00', org: '这里显示调度企业名称' },
  { vehicle: 'YD12313121317', status: '已暂停', type: '内部调度', dispatchNo: 'DD20240813001', waypointCount: 2, waybillCount: 2, goodsCount: 2, loadAddr: '福建省福州市马尾区xxxxxxxxxxxxxx600号', loadTime: '2023-12-12 11:00', unloadAddr: '湖北省武汉市阳逻港xxxxxxxxxxxx', unloadTime: '2023-12-14 09:00', org: '这里显示调度企业名称' },
]

const dispatchRecords = computed(() => {
  const fromBidding = (props.plan.capacityBiddingRecords || [])
    .filter(r => r.status === '已确认' && r.dispatchNo)
    .map(r => ({
      vehicle: 'YD12313121312',
      status: '待执行',
      type: '内部调度',
      dispatchNo: r.dispatchNo,
      waypointCount: 3,
      waybillCount: 2,
      goodsCount: 2,
      loadAddr: '福建省福州市马尾区xxxxxxxxxxxxxx100号',
      loadTime: '2023-12-14 00:00',
      unloadAddr: '福建省福州市马尾区xxxxxxxxxxxxxx100号',
      unloadTime: '2023-12-14 00:00',
      org: '这里显示调度企业名称',
    }))

  // 竞价已确认生成的调度在前，设计稿示例调度在后
  return [...fromBidding, ...mockRecords]
})
</script>

<style scoped>
.dispatch-panel {
  padding: 12px;
  box-sizing: border-box;
  height: 100%;
  overflow-y: auto;
}
.dp-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 260px;
  color: #797b7d;
  font-size: 14px;
}
.dp-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dp-card {
  border: 1px solid #e6ebf2;
  border-radius: 4px;
  background: #fff;
  padding: 14px;
}
.dp-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dp-vehicle {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}
.dp-status {
  padding: 1px 8px;
  border-radius: 2px;
  background: #eef4ff;
  color: #3a65ff;
  font-size: 12px;
  font-weight: 700;
}
.dp-type {
  padding: 1px 8px;
  border-radius: 2px;
  background: #eef0f4;
  color: #595e85;
  font-size: 12px;
  font-weight: 700;
}
.dp-dispatch-no {
  width: 100%;
  color: #3a65ff;
  font-size: 12px;
}
.dp-stats {
  display: flex;
  gap: 16px;
  margin-top: 10px;
  color: #333;
  font-size: 14px;
}
.dp-stat b {
  color: #3a65ff;
  font-weight: 700;
}
.dp-route {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f2f6;
}
.dp-route-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}
.dp-route-item:last-child {
  margin-bottom: 0;
}
.dp-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}
.dp-badge.load { background: #3a65ff; }
.dp-badge.unload { background: #21bd88; }
.dp-route-info {
  flex: 1;
  min-width: 0;
}
.dp-addr {
  display: block;
  font-size: 13px;
  color: #333;
  word-break: break-all;
}
.dp-time {
  display: block;
  font-size: 12px;
  color: #999;
}
.dp-org {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f2f6;
  font-size: 13px;
  color: #333;
}
</style>
