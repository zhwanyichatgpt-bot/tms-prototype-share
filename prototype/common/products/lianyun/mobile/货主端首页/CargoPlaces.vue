<template>
  <section class="cgd-places" aria-label="装卸地址与托运说明">
    <div v-for="(place,index) in [cargo.origin,cargo.destination]" :key="index" class="cgd-place">
      <span class="cgd-point" :class="{end:index===1}">{{ index?'终':'起' }}</span>
      <div><strong>{{ [place.city,place.district].filter(Boolean).join('·') }}</strong><p>{{ place.address }}</p></div>
      <van-icon v-if="!compact" name="location" aria-hidden="true"/>
      <span v-else-if="index===0" class="cgd-tag">{{ modeNames[cargo.mode] }}</span>
    </div>
    <div v-if="cargo.summary" class="cgd-description"><p>{{ compact?'备注：':'' }}{{ cargo.summary }}</p><button v-if="!compact" :aria-expanded="expanded" @click="expanded=!expanded">{{ expanded?'收起':'展开更多' }}<van-icon :name="expanded?'arrow-up':'arrow-down'"/></button><dl v-if="expanded" class="cgd-facts"><template v-for="row in cargoPublishedRequirements(cargo)" :key="row[0]"><dt>{{ row[0] }}</dt><dd>{{ row[1] }}</dd></template></dl></div>
  </section>
</template>
<script setup>
import { ref } from 'vue'
import { cargoPublishedRequirements } from './cargo-data.js'
defineProps({cargo:{type:Object,required:true},compact:Boolean})
const expanded=ref(false)
const modeNames={road:'公路运输',rail:'铁路运输',water:'水路运输',multi:'多式联运'}
</script>
