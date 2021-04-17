<template>
  <div id="mapbox" />
</template>

<script lang="ts">
import Vue from 'vue'
import mapboxgl, { MapboxOptions } from 'mapbox-gl'

const options: MapboxOptions = {
  accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
  container: 'mapbox',
  style: 'mapbox://styles/mapbox/light-v10',
  center: [138, 38],
  zoom: 8
}

export default Vue.extend({
  name: 'reachability',
  mounted () {
    const map = new mapboxgl.Map(options)
  }
})
</script>

<style scoped>
#mapbox {
  width: 100vw;
  height: 100vh;
}
</style>
