<template>
  <svg v-if="kind === 'radar'" viewBox="0 0 230 196" role="img" :aria-label="label">
    <defs><linearGradient id="business-radar-fill" x2="0" y2="1"><stop stop-color="#5097ff" stop-opacity=".65"/><stop offset="1" stop-color="#78d5ff" stop-opacity=".3"/></linearGradient></defs>
    <polygon v-for="level in [1,.75,.5,.25]" :key="level" :points="radarPoints(data.map(() => 100 * level))" fill="#eef3ff" fill-opacity=".35" stroke="#d2dcee"/>
    <line v-for="(item,i) in data" :key="item.label" x1="115" y1="96" :x2="radarPoint(i,100)[0]" :y2="radarPoint(i,100)[1]" stroke="#d2dcee"/>
    <polygon :points="radarPoints(data.map(d => d.value))" fill="url(#business-radar-fill)" stroke="#476dff" stroke-width="2"/>
    <g v-for="(item,i) in data" :key="item.label">
      <circle :cx="radarPoint(i,item.value)[0]" :cy="radarPoint(i,item.value)[1]" r="3" fill="white" stroke="#476dff" stroke-width="1.5"/>
      <text :x="radarPoint(i,137)[0]" :y="radarPoint(i,137)[1]-2" text-anchor="middle" class="chart-label">{{ item.label }}</text>
      <text :x="radarPoint(i,137)[0]" :y="radarPoint(i,137)[1]+13" text-anchor="middle" class="chart-value">{{ item.value }}</text>
    </g>
  </svg>
  <svg v-else-if="kind === 'risk'" viewBox="0 0 230 145" role="img" :aria-label="label">
    <g v-for="(item,i) in data" :key="item.key">
      <path :d="arc(i * 45 + 2, (i+1) * 45 - 2)" :fill="colors[i]" stroke="white" stroke-width="2"/>
      <text :x="arcPoint(i*45+22.5,79)[0]" :y="arcPoint(i*45+22.5,79)[1]" text-anchor="middle" class="risk-label">{{ item.short }}</text>
      <text :x="arcPoint(i*45+22.5,79)[0]" :y="arcPoint(i*45+22.5,79)[1]+15" text-anchor="middle" class="risk-count">{{ item.count }}</text>
    </g>
    <text x="115" y="103" text-anchor="middle" class="risk-center">{{ value }}单</text>
    <text x="115" y="121" text-anchor="middle" class="chart-label">优先跟进</text>
  </svg>
  <svg v-else-if="kind === 'trend'" viewBox="0 0 306 172" role="img" :aria-label="label">
    <defs><linearGradient id="business-trend-fill" x2="0" y2="1"><stop stop-color="#8bafff" stop-opacity=".45"/><stop offset="1" stop-color="#edf2ff" stop-opacity=".1"/></linearGradient></defs>
    <g v-for="t in [0,.5,1]" :key="t">
      <line x1="32" :y1="128-t*94" x2="288" :y2="128-t*94" stroke="#dce3f0" stroke-dasharray="3 3"/>
      <text x="27" :y="132-t*94" text-anchor="end" class="axis-label">{{ Math.round(trendMin+(trendMax-trendMin)*t) }}</text>
    </g>
    <path :d="trendArea" fill="url(#business-trend-fill)"/>
    <polyline :points="trendPoints('reference')" fill="none" stroke="#aab5cf" stroke-width="2" stroke-dasharray="4 3"/>
    <polyline :points="trendPoints('value')" fill="none" stroke="#4e72ff" stroke-width="2.5"/>
    <g v-for="(item,i) in data" :key="item.label">
      <circle :cx="trendX(i)" :cy="trendY(item.value)" r="3.5" fill="white" stroke="#4e72ff" stroke-width="2"/>
      <text :x="trendX(i)" :y="trendY(item.value)-9" text-anchor="middle" class="chart-value">{{ Math.round(item.value) }}</text>
      <text :x="trendX(i)" y="151" text-anchor="middle" class="axis-label">{{ item.label }}</text>
    </g>
  </svg>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ kind: String, data: { type: Array, default: () => [] }, value: Number, label: String })
const colors = ['#dce6ff','#b9ceff','#91b3ff','#678dff']
function radarPoint(i, value) { const a = -Math.PI/2 + i * Math.PI*2 / props.data.length; return [115 + Math.cos(a)*57*value/100,96 + Math.sin(a)*57*value/100] }
const radarPoints = values => values.map((v,i) => radarPoint(i,v).join(',')).join(' ')
function arcPoint(a,r) { const t = (180+a)*Math.PI/180; return [115+Math.cos(t)*r,115+Math.sin(t)*r] }
function arc(a,b) { const p = [arcPoint(a,106),arcPoint(b,106),arcPoint(b,52),arcPoint(a,52)]; return 'M'+p[0]+' A106 106 0 0 1 '+p[1]+' L'+p[2]+' A52 52 0 0 0 '+p[3]+' Z' }
const trendMin = computed(() => Math.floor((Math.min(...props.data.flatMap(d => [d.value,d.reference]))-6)/10)*10)
const trendMax = computed(() => Math.ceil((Math.max(...props.data.flatMap(d => [d.value,d.reference]))+6)/10)*10)
const trendX = i => 41 + i*236/Math.max(1,props.data.length-1)
const trendY = v => 128-(v-trendMin.value)/Math.max(1,trendMax.value-trendMin.value)*94
const trendPoints = key => props.data.map((d,i) => trendX(i)+','+trendY(d[key])).join(' ')
const trendArea = computed(() => 'M41 128 L'+trendPoints('value').replaceAll(' ',' L')+' L'+trendX(props.data.length-1)+' 128 Z')
</script>
<style scoped>
svg{display:block;width:100%;height:auto;overflow:visible;font-family:inherit}
.chart-label{font-size:12px;fill:#53627d}.chart-value{font-size:12px;font-weight:600;fill:#2e4973}.axis-label{font-size:11px;fill:#637086}.risk-label{font-size:12px;fill:#304567}.risk-count{font-size:14px;fill:#253956;font-weight:600}.risk-center{font-size:21px;fill:#304567;font-weight:700}
</style>
