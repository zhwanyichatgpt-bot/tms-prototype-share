<template>
  <el-dialog
    :model-value="visible"
    title="新增水运计划"
    width="500px"
    :align-center="true"
    :append-to-body="true"
    :close-on-click-modal="true"
    class="plan-type-select-dialog"
    @close="handleClose"
  >
    <div class="type-cards-container">
      <!-- 卡片 1：散杂货运输 -->
      <div class="type-card" @click="handleSelectType('散杂货')">
        <div class="card-icon-wrap">
          <!-- 3D 水运散杂货运输插画 SVG (缩小比例) -->
          <svg width="96" height="76" viewBox="0 0 120 96" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_d_bulk)">
              <!-- 后层票据卡片 -->
              <rect x="22" y="22" width="76" height="48" rx="8" fill="url(#paint0_linear_bulk)"/>
              <rect x="22.5" y="22.5" width="75" height="47" rx="7.5" stroke="#FFFFFF" stroke-opacity="0.6"/>
              <!-- 卡片上的线条 -->
              <rect x="30" y="32" width="34" height="4" rx="2" fill="#FFFFFF" fill-opacity="0.8"/>
              <rect x="30" y="40" width="22" height="4" rx="2" fill="#FFFFFF" fill-opacity="0.6"/>

              <!-- 顶部突出芯片/小标签 -->
              <rect x="68" y="14" width="24" height="20" rx="4" fill="#3B82F6" stroke="#FFFFFF" stroke-width="1.5"/>
              <path d="M74 20H86M74 24H82M74 28H84" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>

              <!-- 前层浮动卡片 (渐变青蓝) -->
              <g filter="url(#filter1_d_bulk)">
                <rect x="14" y="34" width="70" height="42" rx="8" fill="url(#paint1_linear_bulk)"/>
                <rect x="14.5" y="34.5" width="69" height="41" rx="7.5" stroke="#FFFFFF" stroke-opacity="0.8"/>
                <!-- 票据凹槽装饰 -->
                <circle cx="24" cy="46" r="4" fill="#FFFFFF" fill-opacity="0.9"/>
                <circle cx="34" cy="46" r="4" fill="#FFFFFF" fill-opacity="0.9"/>
                <rect x="20" y="56" width="38" height="4" rx="2" fill="#FFFFFF" fill-opacity="0.9"/>
                <rect x="20" y="64" width="26" height="3" rx="1.5" fill="#FFFFFF" fill-opacity="0.7"/>

                <!-- 发货箱图标 -->
                <rect x="62" y="52" width="14" height="14" rx="2.5" fill="#FFFFFF" fill-opacity="0.9"/>
                <path d="M64 57H74M64 61H74" stroke="#2563EB" stroke-width="1.2" stroke-linecap="round"/>
              </g>
            </g>
            <defs>
              <filter id="filter0_d_bulk" x="6" y="8" width="108" height="88" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#2F65EE" flood-opacity="0.15"/>
              </filter>
              <filter id="filter1_d_bulk" x="8" y="28" width="82" height="56" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#0284C7" flood-opacity="0.2"/>
              </filter>
              <linearGradient id="paint0_linear_bulk" x1="22" y1="22" x2="98" y2="70" gradientUnits="userSpaceOnUse">
                <stop stop-color="#60A5FA"/>
                <stop offset="1" stop-color="#2563EB"/>
              </linearGradient>
              <linearGradient id="paint1_linear_bulk" x1="14" y1="34" x2="84" y2="76" gradientUnits="userSpaceOnUse">
                <stop stop-color="#38BDF8"/>
                <stop offset="1" stop-color="#0284C7"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="card-title">散杂货运输</div>
        <div class="card-desc">散杂货运输、整车运输</div>
      </div>

      <!-- 卡片 2：集装箱运输 -->
      <div class="type-card" @click="handleSelectType('集装箱')">
        <div class="card-icon-wrap">
          <!-- 3D 水运集装箱运输插画 SVG (缩小比例) -->
          <svg width="96" height="76" viewBox="0 0 120 96" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_d_box)">
              <!-- 后层背景发货面板 -->
              <rect x="42" y="16" width="60" height="42" rx="6" fill="url(#paint0_linear_box)"/>
              <rect x="42.5" y="16.5" width="59" height="41" rx="5.5" stroke="#FFFFFF" stroke-opacity="0.7"/>
              <rect x="50" y="24" width="28" height="4" rx="2" fill="#FFFFFF" fill-opacity="0.8"/>
              <rect x="50" y="32" width="20" height="3" rx="1.5" fill="#FFFFFF" fill-opacity="0.6"/>

              <!-- 认证/清单徽章 -->
              <circle cx="86" cy="28" r="7" fill="#3B82F6" stroke="#FFFFFF" stroke-width="1.5"/>
              <path d="M83 28L85 30L89 26" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>

              <!-- 前层立体叠放集装箱群 -->
              <g filter="url(#filter1_d_box)">
                <!-- 集装箱 1 (底层大箱) -->
                <rect x="18" y="42" width="46" height="28" rx="4" fill="url(#paint1_linear_box)"/>
                <rect x="18.5" y="42.5" width="45" height="27" rx="3.5" stroke="#FFFFFF" stroke-opacity="0.8"/>
                <!-- 瓦楞凹槽纹理 -->
                <path d="M25 45V67M31 45V67M37 45V67M43 45V67M49 45V67M55 45V67" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="1.5" stroke-linecap="round"/>

                <!-- 集装箱 2 (右侧中箱) -->
                <rect x="54" y="34" width="42" height="36" rx="4" fill="url(#paint2_linear_box)"/>
                <rect x="54.5" y="34.5" width="41" height="35" rx="3.5" stroke="#FFFFFF" stroke-opacity="0.9"/>
                <!-- 瓦楞凹槽纹理 -->
                <path d="M61 37V67M67 37V67M73 37V67M79 37V67M85 37V67" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="1.5" stroke-linecap="round"/>
                <!-- 箱锁机构 -->
                <rect x="69" y="48" width="6" height="8" rx="1.5" fill="#FFFFFF" fill-opacity="0.9"/>
              </g>
            </g>
            <defs>
              <filter id="filter0_d_box" x="8" y="8" width="104" height="84" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#2F65EE" flood-opacity="0.15"/>
              </filter>
              <filter id="filter1_d_box" x="12" y="28" width="90" height="52" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#0284C7" flood-opacity="0.2"/>
              </filter>
              <linearGradient id="paint0_linear_box" x1="42" y1="16" x2="102" y2="58" gradientUnits="userSpaceOnUse">
                <stop stop-color="#60A5FA"/>
                <stop offset="1" stop-color="#2563EB"/>
              </linearGradient>
              <linearGradient id="paint1_linear_box" x1="18" y1="42" x2="64" y2="70" gradientUnits="userSpaceOnUse">
                <stop stop-color="#38BDF8"/>
                <stop offset="1" stop-color="#0EA5E9"/>
              </linearGradient>
              <linearGradient id="paint2_linear_box" x1="54" y1="34" x2="96" y2="70" gradientUnits="userSpaceOnUse">
                <stop stop-color="#22D3EE"/>
                <stop offset="1" stop-color="#0284C7"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="card-title">集装箱运输</div>
        <div class="card-desc">集装箱运输、整箱运输</div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'select', 'close'])

function handleClose() {
  emit('update:visible', false)
  emit('close')
}

function handleSelectType(type) {
  emit('select', type)
}
</script>

<style scoped>
.type-cards-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 4px 8px 16px 8px;
  box-sizing: border-box;
}

.type-card {
  flex: 1;
  max-width: 216px;
  height: 168px;
  background: #FFFFFF;
  border: 1px solid #E5E6EB;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 10px 8px;
  box-sizing: border-box;
  transition: all 0.22s cubic-bezier(0.25, 0.8, 0.25, 1);
  user-select: none;
}

.type-card:hover {
  border-color: #2F65EE;
  background: #F8FAFF;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(47, 101, 238, 0.12);
}

.card-icon-wrap {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1D2129;
  margin-top: 6px;
  line-height: 20px;
  transition: color 0.2s;
}

.type-card:hover .card-title {
  color: #2F65EE;
}

.card-desc {
  font-size: 11px;
  color: #86909C;
  margin-top: 2px;
  line-height: 16px;
}
</style>

<style>
/* 弹窗圆角与头部样式 */
.plan-type-select-dialog.el-dialog {
  border-radius: 8px !important;
  overflow: hidden;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.15) !important;
}

.plan-type-select-dialog .el-dialog__header {
  margin-right: 0 !important;
  padding: 14px 18px 6px 18px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  color: #1D2129 !important;
  border-bottom: none !important;
}

.plan-type-select-dialog .el-dialog__body {
  padding: 4px 16px 16px 16px !important;
}
</style>
