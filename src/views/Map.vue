<template>
  <div>
    <div id="mapbox" />
    <el-card id="side-panel">
      最大移動時間: {{ maxMinutes }} [min]
      <el-slider
        v-model="maxMinutes"
        :min="5"
        :max="60"
        :step="5"
      />
      <el-divider />
      <el-select :value="colorScheme" @change="onChangeScheme">
        <el-option
          v-for="(item, idx) in colorSchemes"
          :key="idx"
          :label="`Color scale: ${item[0]}`"
          :value="item[1]">
        </el-option>
      </el-select>
      <el-row id="color-row">
        <el-col :span="2">0</el-col>
        <el-col :span="22" :style="{ minHeight: '20px' }">
          <span
            v-for="n in maxMinutes"
            :key="n"
            class="color-box"
            :style="{ background: interpolate(n) }"
          />
          <span id="max-minutes">{{ maxMinutes }}</span>
        </el-col>
      </el-row>
      <el-divider />
    </el-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import mapboxgl, { MapboxOptions, Expression, GeoJSONSource } from 'mapbox-gl'
import { FeatureCollection } from 'geojson'
import { rgb } from 'd3-color'
import stationData from '../data/gsix60.json'
import railData from '../data/N02-19_RailroadSection.json'
import { railColor, createColorStops, colorSchemes, ColorScheme, ramp } from '../utils/color'

Vue.use(ElementUI)

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
      map: undefined as (undefined | mapboxgl.Map),
      maxMinutes: 60,
      colorScheme: colorSchemes.Spectral,
      colorSchemes: Object.entries(colorSchemes)
    }
  },
  watch: {
    maxMinutes: function (minutes) {
      // Filter stations and update map
      const filteredStation = {
        ...stationData,
        features: stationData.features.filter(f => f.properties.time <= minutes)
      } as FeatureCollection
      const stationSource = this.map!.getSource('stations') as GeoJSONSource
      stationSource.setData(filteredStation)
    }
  },
  methods: {
    interpolate: function (val: number) {
      const color = ramp(this.colorScheme)
      // return color(val / this.maxMinutes)
      return color(val / 60)
    },
    onChangeScheme: function (scheme: ColorScheme) {
      this.colorScheme = scheme
      const stationLayer = this.createStationLayer(this.colorScheme)
      if (this.map && this.map.getLayer('stations')) {
        this.map!.removeLayer('stations')
        this.map!.addLayer(stationLayer)
      }
    },
    createStationLayer: function (scheme: ColorScheme) {
      const stationLayer: mapboxgl.CircleLayer = {
        id: 'stations',
        type: 'circle',
        source: 'stations',
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'interpolate-hcl',
            ['linear'],
            ['get', 'time'],
            ...createColorStops(scheme)
          ] as Expression
        }
      }
      return stationLayer
    }
  },
  mounted () {
    const map = new mapboxgl.Map(options)
    map.on('load', () => {
      map.addSource('stations', {
        type: 'geojson',
        data: stationData as FeatureCollection
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
            ...Object.entries(railColor).map(e => [e[0], rgb(...e[1]).formatHex()]).flat(),
            '#969696' // fallback: default color
          ] as Expression
        }
      }
      const stationLayer = this.createStationLayer(this.colorScheme)
      map.addLayer(railLayer)
      map.addLayer(stationLayer)
      map.on('click', 'stations', (e: any) => {
        const prop = e.features[0].properties
        new mapboxgl.Popup()
          .setLngLat(e.features[0].geometry.coordinates)
          .setHTML(`<b>${prop.name || ''}駅</b><br />${prop.time}[min] / 乗換${prop.transit_count}回`)
          .addTo(map)
      })
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

#side-panel {
  width: 300px;
  height: calc(100vh - 20px);
  z-index: 999;
  position: absolute;
  top: 10px;
  left: 10px;
  overflow: scroll;
  padding: 0px;
  background: #fafafa;
}

#color-row {
  margin-top: 20px;
}

.color-box {
  width: 3px;
  height: 20px;
  float: left;
}

#max-minutes {
  float: left;
  margin-left: 10px;
}
</style>
