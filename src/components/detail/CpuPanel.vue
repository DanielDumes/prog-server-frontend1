<template>
  <div class="panel">
    <header class="panel-head">
      <div class="ph-mark ph-mark--teal"></div>
      <div class="ph-text">
        <span class="ph-title">Procesador</span>
        <span class="ph-meta">{{ data.summary?.cpu_count ?? '?' }} núcleos físicos</span>
      </div>
      <div class="ph-chip" :class="'chip--' + maxCpuStatus">
        {{ maxCpuReading }}°C
      </div>
    </header>

    <div class="panel-body">
      <div class="gauge-wrap">
        <svg viewBox="0 0 180 100" class="gauge-svg">
          <path d="M 18 90 A 72 72 0 0 1 162 90" fill="none" stroke="#e8e4df" stroke-width="10" stroke-linecap="round"/>
          <path d="M 18 90 A 72 72 0 0 1 162 90" fill="none"
            :stroke="cpuArcColor" stroke-width="10" stroke-linecap="round"
            :stroke-dasharray="`${(maxCpuReading / 100) * 226} 226`"/>
          <text x="90" y="83" text-anchor="middle" font-size="30" font-weight="700" :fill="cpuArcColor" font-family="'IBM Plex Mono', monospace" letter-spacing="-1">{{ maxCpuReading }}</text>
          <text x="90" y="97" text-anchor="middle" font-size="9" fill="#9a9490" font-family="'Sora', system-ui" letter-spacing="1.5">°C NÚCLEO MÁX</text>
        </svg>
      </div>

      <div class="spec-row">
        <div class="spec-tile">
          <div class="st-val">{{ data.summary?.cpu_count ?? '—' }}</div>
          <div class="st-lbl">Sockets</div>
        </div>
        <div class="spec-tile">
          <div class="st-val">{{ data.summary?.logical_cpu_count || '—' }}</div>
          <div class="st-lbl">Hilos lógicos</div>
        </div>
        <div class="spec-tile spec-wide">
          <div class="st-val st-mono" style="font-size:10px">{{ data.summary?.cpu_model || '—' }}</div>
          <div class="st-lbl">Modelo CPU</div>
        </div>
      </div>

      <div class="sensor-list" v-if="cpuTempSensors.length">
        <div class="sensor-row" v-for="s in cpuTempSensors" :key="s.name">
          <span class="s-led" :class="'led--' + getSensorStatus(s)"></span>
          <span class="s-name">{{ s.name.replace('CPU ', '') }}</span>
          <span class="s-val" :class="'sval--' + getSensorStatus(s)">{{ s.reading_c }}°</span>
        </div>
      </div>
    </div>

    <footer class="panel-foot">
      <span class="pf-label">S/N Sistema</span>
      <span class="pf-val">{{ data.summary?.serial || '—' }}</span>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ data: { type: Object, required: true } })

const cpuTempSensors = computed(() =>
  (props.data?.temperatures ?? []).filter(t => t.name?.toLowerCase().includes('cpu'))
)

const maxCpuReading = computed(() => {
  const v = cpuTempSensors.value.map(s => s.reading_c).filter(v => v != null)
  return v.length ? Math.max(...v) : 0
})

function getSensorStatus(s) {
  if (!s.reading_c) return 'ok'
  // 1. Prioridad: Umbrales reales del hardware (iLO)
  if (s.upper_critical && s.reading_c >= s.upper_critical) return 'crit'
  if (s.upper_caution  && s.reading_c >= s.upper_caution)  return 'warn'
  // 2. Fallback: Límites técnicos suaves para sensores sin umbral
  if (s.reading_c >= 90) return 'crit'
  if (s.reading_c >= 75) return 'warn'
  return 'ok'
}

const maxCpuStatus = computed(() => {
  if (!cpuTempSensors.value.length) return 'teal'
  const statuses = cpuTempSensors.value.map(getSensorStatus)
  if (statuses.includes('crit')) return 'red'
  if (statuses.includes('warn')) return 'amber'
  return 'teal'
})

const cpuArcColor = computed(() => {
  const status = maxCpuStatus.value
  return status === 'red' ? '#c0392b' : status === 'amber' ? '#e67e22' : '#1a8a7a'
})
</script>

<style scoped>
/* Panel chrome */
.panel { background:white; border:1.5px solid #ddd8d0; border-radius:18px; display:flex; flex-direction:column; overflow:hidden; transition:transform .18s,box-shadow .18s; }
.panel:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(26,23,20,.07); }
.panel-head { padding:18px 22px; display:flex; align-items:center; gap:12px; border-bottom:1px solid #ede9e4; background:#faf8f5; }
.ph-mark { width:3px; height:28px; border-radius:2px; flex-shrink:0; }
.ph-mark--teal { background:#1a8a7a; }
.ph-text { flex:1; }
.ph-title { display:block; font-size:12px; font-weight:800; color:#1a1714; text-transform:uppercase; letter-spacing:.07em; }
.ph-meta  { display:block; font-size:10px; font-weight:500; color:#9a9490; margin-top:2px; text-transform:uppercase; letter-spacing:.05em; }
.ph-chip  { font-family:'IBM Plex Mono',monospace; font-size:13px; font-weight:600; padding:5px 11px; border-radius:8px; }
.chip--teal  { background:#e6f5f2; color:#0f6e44; border:1px solid #b8e4dc; }
.chip--amber { background:#fef3e6; color:#854f0b; border:1px solid #f9d5a5; }
.chip--red   { background:#fdecea; color:#a32d2d; border:1px solid #f5c0c0; }
.panel-body { padding:22px; flex:1; display:flex; flex-direction:column; gap:16px; }
.panel-foot { padding:12px 22px; border-top:1px solid #ede9e4; background:#faf8f5; display:flex; align-items:center; gap:10px; font-size:10px; font-weight:600; }
.pf-label { color:#9a9490; text-transform:uppercase; letter-spacing:.08em; }
.pf-val   { color:#1a1714; font-family:'IBM Plex Mono',monospace; font-size:11px; }
/* Gauge */
.gauge-wrap { display:flex; justify-content:center; }
.gauge-svg  { width:180px; height:105px; }
/* Spec row */
.spec-row  { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.spec-tile { background:#f5f2ee; border-radius:12px; padding:12px 14px; border:1px solid #ddd8d0; }
.spec-wide { grid-column:1/-1; }
.st-val  { font-size:20px; font-weight:800; color:#1a1714; letter-spacing:-.03em; }
.st-mono { font-family:'IBM Plex Mono',monospace; font-size:10px !important; letter-spacing:0; font-weight:600; }
.st-lbl  { font-size:9px; font-weight:700; color:#9a9490; text-transform:uppercase; letter-spacing:.09em; margin-top:4px; }
/* Sensor list */
.sensor-list { display:flex; flex-direction:column; gap:6px; }
.sensor-row  { display:flex; align-items:center; gap:10px; background:#f5f2ee; padding:7px 12px; border-radius:8px; border:1px solid #ddd8d0; }
.s-name { font-size:11px; font-weight:600; color:#4a4540; flex:1; }
.s-val  { font-family:'IBM Plex Mono',monospace; font-size:13px; font-weight:600; }
.sval--ok   { color:#0f6e44; }
.sval--warn { color:#854f0b; }
.sval--crit { color:#a32d2d; }
.s-led      { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.led--ok    { background:#1a8a7a; }
.led--warn  { background:#e67e22; }
.led--crit  { background:#c0392b; animation:blink 1s infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.25} }
</style>
