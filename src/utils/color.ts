import { interpolateRgbBasis } from 'd3-interpolate'
import {
  schemeSpectral,
  schemeRdYlBu,
  schemeRdYlGn
} from 'd3-scale-chromatic'

interface ColorDict {
  [name: string]: [number, number, number]
}

export type ColorScheme = (readonly (readonly string[])[])

interface ColorSchemes {
  [name: string]: ColorScheme
}

export const railColor: ColorDict = {
  // 東京メトロ
  '2号線日比谷線': [181, 181, 173],
  '3号線銀座線': [241, 154, 56],
  '4号線丸ノ内線': [226, 67, 64],
  '4号線丸ノ内線分岐線': [226, 67, 64],
  '5号線東西線': [68, 153, 187],
  '7号線南北線': [77, 169, 155],
  '8号線有楽町線': [189, 165, 119],
  '9号線千代田線': [84, 184, 137],
  '11号線半蔵門線': [139, 118, 208],
  '13号線副都心線': [147, 97, 58],

  // 都営地下鉄
  '1号線浅草線': [208, 78, 60],
  '6号線三田線': [46, 106, 177],
  '10号線新宿線': [179, 193, 70],
  '12号線大江戸線': [182, 39, 93],

  // JR
  '山手線': [154, 205, 50],
  '赤羽線（埼京線）': [0, 172, 154],
  '東北線（埼京線）': [0, 172, 154],
  '東北線': [0, 178, 229], // 京浜東北線は東北線でいいのか？
  '根岸線': [0, 178, 229],
  '中央線': [241, 90, 34],
  '青梅線': [241, 90, 34],
  '五日市線': [241, 90, 34],
  '総武線': [255, 212, 0],
  '南武線': [255, 212, 0],
  '鶴見線': [255, 212, 0],
  '常磐線': [0, 178, 97],
  '成田線': [0, 178, 97],
  '京葉線': [201, 37, 47],
  '武蔵野線': [241, 90, 34],
  '東海道線': [246, 139, 30],
  '伊東線': [246, 139, 30],
  '宇都宮線': [246, 139, 30],
  '高崎線': [246, 139, 30],

  // 私鉄
  '京王線': [221, 0, 119],
  '競馬場線': [221, 0, 119],
  '高尾線': [221, 0, 119],
  '相模原線': [221, 0, 119],
  '動物園線': [221, 0, 119],
  '井の頭線': [0, 0, 136],
  '江ノ島線': [34, 136, 204],
  '小田原線': [34, 136, 204],
  '多摩線': [34, 136, 204]
}

export function createColorStops (scheme: ReadonlyArray<ReadonlyArray<string>>, maxMinutes = 60) {
  const colorStops = scheme[scheme.length - 1]

  const res: (string | number)[] = []
  colorStops.forEach((hex, i) => {
    res.push(maxMinutes * i / (colorStops.length - 1))
    res.push(hex)
  })
  return res
}

export const colorSchemes: ColorSchemes = {
  Spectral: schemeSpectral,
  RdYlBu: schemeRdYlBu,
  RdYlGn: schemeRdYlGn
}

export function ramp (scheme: ColorScheme) {
  const colors = scheme[scheme.length - 1]
  return interpolateRgbBasis(colors as string[])
}
