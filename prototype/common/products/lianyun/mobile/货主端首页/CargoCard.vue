<template>
  <button type="button" class="lc-card" :aria-label="`${cargo.goods}${cargo.quantity}，${placeLabel(cargo.origin)}至${placeLabel(cargo.destination)}，查看货源`" @click="$emit('open',cargo)">
    <span v-if="match" class="lc-match"><strong>匹配度 {{ match.score }}%</strong></span>
    <span class="lc-dates"><span><b>{{ dateLabel(cargo.loadDate) }}</b> {{ cargo.mode==='water'?'装船':'装货' }}</span><i/><span><b>{{ dateLabel(cargo.unloadDate) }}</b> {{ cargo.mode==='water'?'卸船':'卸货' }}</span></span>
    <span class="lc-route-price">
      <span class="lc-route"><span>{{ placeLabel(cargo.origin) }}</span><span>{{ placeLabel(cargo.destination) }}</span></span>
      <span class="lc-price" :class="{'lc-price-estimate':showEstimate}"><template v-if="showEstimate"><small>预计运价</small><strong>{{ estimatedCargoPrice(cargo) }}</strong><small v-if="cargo.estimatedFreight" class="lc-price-unit">{{ cargo.estimatedFreight.unit }}</small></template><template v-else><small>{{ cargo.price.label }}</small><strong>{{ cargoPrice(cargo) }}</strong></template></span>
    </span>
    <span class="lc-tags"><span v-for="tag in cargo.tags" :key="tag">{{ tag }}</span></span>
    <span class="lc-publisher"><span><van-icon name="hotel-o"/><span class="lc-publisher-name">{{ cargo.publisher.short }}</span><span class="lc-score">★ {{ cargo.publisher.score.toFixed(1) }}</span></span><small>{{ cargo.publishLabel }}</small></span>
  </button>
</template>
<script setup>
import { cargoPrice, estimatedCargoPrice, dateLabel, placeLabel } from './cargo-data.js'
defineProps({ cargo: { type: Object, required: true }, match: Object, showEstimate: Boolean })
defineEmits(['open'])
</script>
<style scoped>
.lc-match{display:flex;align-items:center;flex-wrap:wrap;gap:4px 7px;margin-bottom:10px;font-size:11px;line-height:18px;color:#647090}.lc-match strong{padding:2px 5px;border-radius:4px;color:#3a65ff;background:#edf2ff;font-weight:600}.lc-match small{margin-left:auto;color:#8a91a1;font-size:10px}

.lc-card{display:block;box-sizing:border-box;width:100%;padding:13px 12px 10px;margin:0 0 10px;background:#fff;border:1px solid #e8ecf3;border-radius:12px;text-align:left;color:#30343b;font:inherit;cursor:pointer}
.lc-dates{display:flex;align-items:center;gap:10px;justify-content:space-between;font-size:12px;white-space:nowrap;margin-bottom:12px}.lc-dates>span{flex:1}.lc-dates>span:last-child{text-align:right}.lc-dates b{font-size:14px;font-weight:600;margin-right:3px}.lc-dates i{height:13px;border-left:1px solid #e0e4ed}
.lc-route-price{display:flex;align-items:center;gap:8px}.lc-route{min-width:0;flex:1;display:flex;flex-direction:column;gap:11px;padding-left:15px}.lc-route>span{position:relative;font-size:13px;font-weight:500;line-height:19px;overflow-wrap:anywhere}.lc-route>span:before{content:'';position:absolute;left:-15px;top:6px;width:6px;height:6px;border-radius:50%;background:#4064ff}.lc-route>span:last-child:before{background:#15b58a}.lc-route>span:first-child:after{content:'';position:absolute;left:-12.5px;top:14px;height:16px;border-left:1px solid #d7dfec}
.lc-price{flex:none;min-width:70px;max-width:95px;display:flex;flex-direction:column;gap:4px;text-align:right}.lc-price small{font-size:10px;color:#8a93a7}.lc-price strong{font-size:17px;color:#4064ff;line-height:22px;white-space:nowrap;font-weight:600}
.lc-tags{display:flex;gap:5px;margin:11px 0;flex-wrap:wrap}.lc-tags>span{flex:1;min-width:max-content;text-align:center;padding:4px 5px;border-radius:4px;background:#eef3ff;color:#62749c;font-size:10px;line-height:14px}
.lc-publisher{display:flex;align-items:center;gap:6px;justify-content:space-between;border-top:1px solid #e9edf4;padding-top:9px;font-size:11px}.lc-publisher>span{display:flex;align-items:center;gap:4px;min-width:0}.lc-publisher .van-icon{padding:3px;border-radius:4px;background:#eef3ff;color:#4064ff;font-size:13px}.lc-publisher-name{max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lc-score{color:#c77b17;white-space:nowrap}.lc-publisher>small{font-size:10px;color:#8b96a9;white-space:nowrap}
.lc-card:focus-visible{outline:2px solid #4064ff;outline-offset:2px}
</style>

<style scoped>
.lc-price.lc-price-estimate{min-width:110px;max-width:145px}
.lc-price-estimate strong{font-size:15px;line-height:20px}
.lc-price-estimate .lc-price-unit{color:#647090;font-size:11px;line-height:14px}
</style>
