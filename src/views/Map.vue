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
      <el-row class="margin-top-20">
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
      <el-row class="margin-top-20">
        <el-col :span="16">
          Adaptive color scale:
        </el-col>
        <el-col :span="8">
          <el-switch v-model="adaptive" />
        </el-col>
      </el-row>
      <el-divider />
      乗換: {{ maxTransit > 0 ? `${maxTransit}回以下` : 'なし' }}
      <el-slider
        v-model="maxTransit"
        :min="0"
        :max="1"
        :step="1"
      />
      <el-divider />
      レイヤー表示設定<br />
      <el-row type="flex">
        <el-checkbox v-model="showRails">路線</el-checkbox>
      </el-row>
      <el-row type="flex">
        <el-checkbox v-model="showStations">駅</el-checkbox>
      </el-row>
      <el-row type="flex">
        <el-checkbox v-model="showIsochrones">等時間線</el-checkbox>
      </el-row>
      <el-divider />
      <el-select :value="mapStyle" @change="onChangeMapStyle">
        <el-option
          v-for="(item, idx) in mapStyles"
          :key="idx"
          :label="`Map style: ${item[0]}`"
          :value="item[1]">
        </el-option>
      </el-select>
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
import isochroneData from '../data/union_isochrones.json' // TODO: 乗り換え回数考慮してない
import { railColor, createColorStops, colorSchemes, ColorScheme, ramp } from '../utils/color'
import { mapStyles } from '../utils/constants'

Vue.use(ElementUI)

const options: MapboxOptions = {
  accessToken: 'pk.eyJ1Ijoic3cxMjI3IiwiYSI6ImNrbngyazRhcjBtY3Iyd3RnODhjbDhscWsifQ.6Uc-Lboqa0WhZbnnFJWFSA', // only for public and URL restricted
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
      colorSchemes: Object.entries(colorSchemes),
      mapStyle: mapStyles.Light,
      mapStyles: Object.entries(mapStyles),
      adaptive: true,
      maxTransit: 1,
      showRails: true,
      showStations: true,
      showIsochrones: true
    }
  },
  computed: {
    minuteNormalizer: function (): number {
      return this.adaptive ? this.maxMinutes : 60
    }
  },
  watch: {
    maxMinutes: function (minutes) {
      const filteredStation = {
        ...stationData,
        features: stationData.features.filter(f => f.properties.time <= minutes)
      }
      this.updateStationData(filteredStation as FeatureCollection)
      this.renderIsochroneLayer(this.map)
    },
    maxTransit: function (transitCount) {
      const filteredStation = {
        ...stationData,
        features: stationData.features.filter(f => f.properties.transit_count <= transitCount)
      }
      this.updateStationData(filteredStation as FeatureCollection)
    },
    adaptive: function (_adaptive) {
      this.renderStationLayer(this.map)
      this.renderIsochroneLayer(this.map)
    },
    colorScheme: function (_scheme) {
      this.renderStationLayer(this.map)
      this.renderIsochroneLayer(this.map)
    },
    showRails: function (show) {
      if (!this.map) return
      this.map.setLayoutProperty('rails', 'visibility', (show ? 'visible' : 'none'))
    },
    showStations: function (show) {
      if (!this.map) return
      this.map.setLayoutProperty('stations', 'visibility', (show ? 'visible' : 'none'))
    },
    showIsochrones: function (show) {
      if (!this.map) return
      this.map.setLayoutProperty('isochrones', 'visibility', (show ? 'visible' : 'none'))
    }
  },
  methods: {
    interpolate: function (val: number) {
      const color = ramp(this.colorScheme)
      return color(val / this.minuteNormalizer)
    },
    onChangeScheme: function (scheme: ColorScheme) {
      this.colorScheme = scheme
    },
    onChangeMapStyle: function (style: string) {
      this.mapStyle = style
      if (this.map) {
        this.map.setStyle(style)
      }
    },
    updateStationData: function (stationData: FeatureCollection) {
      const stationSource = this.map!.getSource('stations') as GeoJSONSource
      stationSource.setData(stationData)
      this.renderStationLayer(this.map)
    },
    renderStationLayer: function (map: (undefined | mapboxgl.Map)) {
      if (!map) return
      if (map.getLayer('stations')) {
        map.removeLayer('stations')
      }
      const stationLayer: mapboxgl.CircleLayer = {
        id: 'stations',
        type: 'circle',
        source: 'stations',
        layout: {
          'visibility': (this.showStations ? 'visible' : 'none')
        },
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'interpolate-hcl',
            ['linear'],
            ['get', 'time'],
            ...createColorStops(this.colorScheme, this.minuteNormalizer)
          ] as Expression
        }
      }
      map.addLayer(stationLayer)
    },
    renderIsochroneLayer: function (map: (undefined | mapboxgl.Map)) {
      if (!map) return
      if (map.getLayer('isochrones')) {
        map.removeLayer('isochrones')
      }
      const isochroneLayer: mapboxgl.LineLayer = {
        id: 'isochrones',
        type: 'line',
        source: 'isochrones',
        layout: {},
        paint: {
          'line-width': 3,
          'line-color': [
            'interpolate-hcl',
            ['linear'],
            ['get', 'minutes'],
            ...createColorStops(this.colorScheme, this.minuteNormalizer)
          ] as Expression
        },
        filter: ['<=', ['get', 'minutes'], this.maxMinutes] as Expression
      }
      map.addLayer(isochroneLayer)
    },
    render: function (map: mapboxgl.Map) {
      map.addSource('stations', {
        type: 'geojson',
        data: stationData as FeatureCollection
      })
      map.addSource('isochrones', {
        type: 'geojson',
        data: isochroneData as FeatureCollection
      })
      map.addSource('rails', {
        type: 'geojson',
        data: railData as FeatureCollection
      })
      const railLayer: mapboxgl.LineLayer = {
        id: 'rails',
        type: 'line',
        source: 'rails',
        layout: {
          'visibility': (this.showRails ? 'visible' : 'none'),
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
      map.addLayer(railLayer)
      this.renderStationLayer(map)
      this.renderIsochroneLayer(map)
      map.on('click', 'stations', (e: any) => {
        const prop = e.features[0].properties
        new mapboxgl.Popup()
          .setLngLat(e.features[0].geometry.coordinates)
          .setHTML(`<b>${prop.name || ''}駅</b><br />${prop.time}[min] / 乗換${prop.transit_count}回`)
          .addTo(map)
      })
    }
  },
  mounted () {
    const map = new mapboxgl.Map(options)
    map.on('style.load', () => {
      this.render(map)
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

.margin-top-20 {
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
