// 联运地图的统一视觉配置；地理信息来自在线矢量底图，路线仍使用当前方案数据。
export const routeMapColors = {
  land: '#dce2e9', water: '#c7cfdd', road: '#ffffff', boundary: '#c9ced3',
  label: '#777d87', city: '#ff727c', route: '#aebcff', mutedRoute: '#c5cce6',
  load: '#5488ef', unload: '#7ac943',
}

export function createRouteMapStyle(network = false) {
  const colors = network ? {...routeMapColors,land:'#d9eaff',water:'#f4f8fd',boundary:'#ffffff',label:'#647089',city:'#8ea9d5'} : routeMapColors
  const source = { source: 'geography', 'source-layer': 'transportation' }
  const places = ['match', ['get', 'class'], ['city', 'town'], true, false]
  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: { geography: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
    layers: [
      { id: 'land', type: 'background', paint: { 'background-color': colors.land } },
      { id: 'water', type: 'fill', source: 'geography', 'source-layer': 'water', paint: { 'fill-color': colors.water } },
      { id: 'waterways', type: 'line', source: 'geography', 'source-layer': 'waterway',
        paint: { 'line-color': colors.water, 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.8, 12, 3] } },
      { id: 'boundaries', type: 'line', source: 'geography', 'source-layer': 'boundary',
        filter: ['all', ['<=', ['get', 'admin_level'], 6], ['!=', ['get', 'maritime'], 1]],
        paint: { 'line-color': colors.boundary, 'line-width': 0.8, 'line-opacity': 0.8 } },
      { id: 'local-roads', type: 'line', ...source, minzoom: 7,
        filter: ['match', ['get', 'class'], ['minor', 'tertiary', 'service'], true, false],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': colors.road, 'line-opacity': 0.75, 'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.5, 14, 2.5] } },
      { id: 'main-roads', type: 'line', ...source,
        filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary', 'secondary'], true, false],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': colors.road, 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.4, 7, 1.3, 12, 2.8] } },
      { id: 'city-rings', type: 'circle', source: 'geography', 'source-layer': 'place', minzoom: 5,
        filter: places, paint: { 'circle-radius': ['match', ['get', 'class'], 'city', 3.2, 2.2],
          'circle-color': '#ffffff', 'circle-stroke-color': colors.city, 'circle-stroke-width': 1.2 } },
      { id: 'city-centers', type: 'circle', source: 'geography', 'source-layer': 'place', minzoom: 5,
        filter: places, paint: { 'circle-radius': 1.3, 'circle-color': colors.city } },
      { id: 'city-labels', type: 'symbol', source: 'geography', 'source-layer': 'place',
        filter: ['match', ['get', 'class'], ['city', 'town', 'country', 'state'], true, false],
        layout: {
          'text-field': ['coalesce', ['get', 'name:zh'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 7, 13, 12, 15],
          'text-anchor': 'bottom', 'text-offset': [0, -0.65], 'text-max-width': 7,
          'text-padding': 6, 'symbol-sort-key': ['coalesce', ['get', 'rank'], 10],
        },
        paint: { 'text-color': colors.label, 'text-halo-color': '#ffffff', 'text-halo-width': 1.3 },
      },
    ],
  }
}
