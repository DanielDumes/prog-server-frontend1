<template>
  <div class="panel">
    <header class="panel-head">
      <div class="ph-mark ph-mark--red"></div>
      <div class="ph-text">
        <span class="ph-title">Mapa térmico</span>
        <span class="ph-meta">{{ groupedTemperatures.length }} zonas · {{ (data.temperatures ?? []).length }} sensores</span>
      </div>
    </header>
    <div class="panel-body">
      <div class="temp-grid">
        <div class="temp-card" v-for="g in groupedTemperatures" :key="g.name + g.count" :class="'tc--' + g.status">
          <div class="tc-val">{{ g.reading !== null ? Math.round(g.reading) + '°' : 'N/A' }}</div>
          <div class="tc-name">{{ g.name }}</div>
          <div class="tc-badge" v-if="g.isGroup">⌀ {{ g.count }}</div>
          <div class="tc-thresh" v-if="!g.isGroup && (g.caution || g.critical)">
            <span v-if="g.caution">C:{{ g.caution }}°</span>
            <span v-if="g.critical">K:{{ g.critical }}°</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ data: { type: Object, required: true } })

const groupedTemperatures = computed(() => {
  const sensors = props.data?.temperatures ?? []
  if (!sensors.length) return []

  function getBaseName(name, location) {
    if (!name) return ''
    let n = name.replace(/^\d+[\s\-\.]+/, '')
    if (location === 'Memory' || location === 'CPU') n = n.replace(/^P\d+[\s\-]+/, '')
    n = n.replace(/[\s\-]+\d+([\-\s]\d+)?$/, '').replace(/\s+[A-Z]{1,4}$/, '')
    return n.trim()
  }
  function zoneKey(s) {
    const n = (s.name || '').toLowerCase()
    if (n.includes('ambient') || n.includes('inlet')) return `unique-${s.name}`
    return `${getBaseName(s.name, s.location).toLowerCase()}:${s.location || 'System'}:${s.upper_caution || '-'}-${s.upper_critical || '-'}`
  }
  function tempClsStr(t) {
    if (!t.reading_c) return 'ok'
    if (t.upper_critical && t.reading_c >= t.upper_critical) return 'crit'
    if (t.upper_caution  && t.reading_c >= t.upper_caution)  return 'warn'
    if (t.reading_c > 85) return 'crit'
    if (t.reading_c > 70) return 'warn'
    return 'ok'
  }

  const zoneMap = new Map()
  sensors.forEach(s => {
    const k = zoneKey(s)
    if (!zoneMap.has(k)) zoneMap.set(k, { sensors: [] })
    zoneMap.get(k).sensors.push(s)
  })

  const result = []
  zoneMap.forEach((zone) => {
    const valid = zone.sensors.filter(s => s.reading_c != null)
    if (!valid.length) return
    const isGroup = valid.length > 1
    const avg = valid.reduce((a, b) => a + b.reading_c, 0) / valid.length
    const ref = valid[0]
    let name = ref.name
    if (isGroup) {
      if (ref.location === 'Memory')    name = 'Memoria RAM'
      else if (ref.location === 'CPU')  name = 'CPU / Procesadores'
      else if (ref.name.includes('VR')) name = 'Reguladores (VRM)'
      else name = getBaseName(ref.name, ref.location)
    }
    const worstStatus = valid.map(s => tempClsStr(s)).reduce((a, b) => {
      if (a === 'crit' || b === 'crit') return 'crit'
      if (a === 'warn' || b === 'warn') return 'warn'
      return 'ok'
    }, 'ok')
    result.push({ name, reading: isGroup ? avg : ref.reading_c, status: worstStatus, isGroup, count: valid.length, caution: ref.upper_caution, critical: ref.upper_critical, location: ref.location })
  })
  result.sort((a, b) => {
    const score = i => {
      const n = i.name.toLowerCase(), l = (i.location || '').toLowerCase()
      if (n.includes('ambient') || n.includes('inlet')) return 1
      if (l === 'cpu' || n.includes('cpu'))             return 2
      if (l === 'memory' || n.includes('ram'))          return 3
      return 10
    }
    const d = score(a) - score(b)
    return d !== 0 ? d : a.name.localeCompare(b.name)
  })
  return result
})
</script>

<style scoped>
/* Panel chrome */
.panel { background:white; border:1.5px solid #ddd8d0; border-radius:18px; display:flex; flex-direction:column; overflow:hidden; transition:transform .18s,box-shadow .18s; }
.panel:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(26,23,20,.07); }
.panel-head { padding:18px 22px; display:flex; align-items:center; gap:12px; border-bottom:1px solid #ede9e4; background:#faf8f5; }
.ph-mark { width:3px; height:28px; border-radius:2px; flex-shrink:0; }
.ph-mark--red { background:#c0392b; }
.ph-text { flex:1; }
.ph-title { display:block; font-size:12px; font-weight:800; color:#1a1714; text-transform:uppercase; letter-spacing:.07em; }
.ph-meta  { display:block; font-size:10px; font-weight:500; color:#9a9490; margin-top:2px; text-transform:uppercase; letter-spacing:.05em; }
.panel-body { padding:22px; flex:1; display:flex; flex-direction:column; gap:16px; }
/* Temp grid */
.temp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(110px,1fr)); gap:8px; }
.temp-card { padding:12px 14px; border-radius:12px; border:1.5px solid #ddd8d0; background:white; transition:all .15s; }
.temp-card:hover { transform:scale(1.02); }
.tc--ok   { background:#f2fbf8; border-color:#b8e4dc; }
.tc--warn { background:#fef9f2; border-color:#f9d5a5; }
.tc--crit { background:#fdf3f3; border-color:#f5c0c0; }
.tc-val  { font-family:'IBM Plex Mono',monospace; font-size:20px; font-weight:600; }
.tc--ok   .tc-val { color:#0f6e44; }
.tc--warn .tc-val { color:#854f0b; }
.tc--crit .tc-val { color:#a32d2d; }
.tc-name  { font-size:9px; font-weight:700; color:#6b6560; text-transform:uppercase; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:.04em; }
.tc-badge { display:inline-block; font-size:8px; font-weight:700; margin-top:5px; padding:2px 6px; border-radius:4px; background:#e6f0fb; color:#185fa5; }
.tc-thresh { font-size:8px; color:#9a9490; margin-top:4px; display:flex; gap:6px; font-family:'IBM Plex Mono',monospace; }
</style>
