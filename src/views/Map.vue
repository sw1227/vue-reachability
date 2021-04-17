<template>
  <div id="mapbox" />
</template>

<script lang="ts">
import Vue from 'vue'
import mapboxgl, { MapboxOptions, Expression } from 'mapbox-gl'
import { FeatureCollection } from 'geojson'
import * as d3 from 'd3-color'
import gsix60 from '../data/gsix60.json'
import railData from '../data/N02-19_RailroadSection.json'
import { railColor } from '../utils/color'

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
      map.addSource('rails', {
        type: 'geojson',
        data: railData as FeatureCollection
      })
      const railLayer: mapboxgl.LineLayer = {
        id: 'rails',
        type: 'line',
        source: 'rails',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-width': 3,
          'line-color': [
            'match',
            ['get', '路線名'],
            // [name, color, name, color, ...]
            ...Object.entries(railColor).map(e => [e[0], d3.rgb(...e[1]).formatHex()]).flat(),
            '#969696' // fallback: default color
          ] as Expression
        }
      }
      const stationLayer: mapboxgl.CircleLayer = {
        id: 'stations',
        type: 'circle',
        source: 'stations',
        paint: {
          'circle-radius': 6,
          'circle-color': '#0ff'
        }
      }
      map.addLayer(railLayer)
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
