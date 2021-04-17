<template>
  <div id="mapbox" />
</template>

<script lang="ts">
import Vue from 'vue'
import mapboxgl, { MapboxOptions } from 'mapbox-gl'
import { FeatureCollection } from 'geojson'
import gsix60 from '../data/gsix60.json'

const options: MapboxOptions = {
  accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
  container: 'mapbox',
  style: 'mapbox://styles/mapbox/light-v10',
  center: [139.7, 35.7],
  zoom: 9
}

export default Vue.extend({
  name: 'reachability',
  data () {
    return {
      map: undefined as (undefined | mapboxgl.Map)
    }
  },
  mounted () {
    const map = new mapboxgl.Map(options)
    map.on('load', () => {
      map.addSource('stations', {
        type: 'geojson',
        data: gsix60 as FeatureCollection
      })
      const stationLayer: mapboxgl.CircleLayer = {
        id: 'stations',
        type: 'circle',
        source: 'stations',
        paint: {
          'circle-radius': 6,
          'circle-color': '#0ff'
        }
      }
      map.addLayer(stationLayer)
    })
    this.map = map
  }
})
</script>

<style scoped>
#mapbox {
  width: 100vw;
  height: 100vh;
}
</style>
