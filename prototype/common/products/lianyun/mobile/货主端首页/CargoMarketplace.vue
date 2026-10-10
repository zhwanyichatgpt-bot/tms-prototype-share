<template>
  <section :class="embedded?'lc-embedded':'lh-section'" aria-label="精选货源"><div v-if="!embedded" class="lh-section-heading"><h2>精选货源</h2><button @click="hallOpen=true">全部货源 ›</button></div><CargoCard v-for="cargo in recommendedCargos" :key="cargo.id" :cargo="cargo" :match="cargo.recommendation" show-estimate @open="openCargo"/><div v-if="!recommendedCargos.length" class="ly-empty"><p>当前区域暂无推荐货源</p><button class="ly-text-button" @click="hallOpen=true">浏览全部货源</button></div></section>
  <Teleport :to="teleport" :disabled="!teleport"><CargoHall v-if="hallOpen" v-show="!selected" @back="hallOpen=false" @open="openCargo"/><CargoDetailPage v-if="selected" :key="selected.id" :cargo="selected" :teleport="teleport" @back="selected=null"/></Teleport>
</template>
<script setup>
import { ref, watch } from 'vue'
import CargoCard from './CargoCard.vue'
import CargoHall from './CargoHall.vue'
import CargoDetailPage from './CargoDetailPage.vue'
import { cargos } from './cargo-data.js'
defineProps({teleport:Object,embedded:Boolean,recommendedCargos:{type:Array,default:()=>cargos.slice(0,2)}})
const emit=defineEmits(['overlay-change'])
const hallOpen=ref(false),selected=ref(null)
function openCargo(cargo){selected.value=cargo}
watch([hallOpen,selected],()=>emit('overlay-change',hallOpen.value||!!selected.value),{flush:'sync'})
function openHall(){hallOpen.value=true}
defineExpose({openCargo,openHall})
</script>
