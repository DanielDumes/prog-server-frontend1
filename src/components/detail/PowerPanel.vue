<template>
  <div class="panel">
    <header class="panel-head">
      <div class="ph-mark ph-mark--amber"></div>
      <div class="ph-text">
        <span class="ph-title">Fuente de Poder</span>
        <span class="ph-meta">{{ powerPct.toFixed(0) }}% carga actual</span>
      </div>
    </header>

    <div class="panel-body">
      <div class="gauge-wrap">
        <svg viewBox="0 0 180 100" class="gauge-svg">
          <path d="M 18 90 A 72 72 0 0 1 162 90" fill="none" stroke="#e8e4df" stroke-width="10" stroke-linecap="round"/>
          <path d="M 18 90 A 72 72 0 0 1 162 90" fill="none"
            :stroke="powerPct > 85 ? '#c0392b' : powerPct > 65 ? '#e67e22' : '#1a8a7a'"
            stroke-width="10" stroke-linecap="round"
            :stroke-dasharray="`${(powerPct / 100) * 226} 226`"/>
          <text x="90" y="83" text-anchor="middle" font-size="30" font-weight="700"
            :fill="powerPct > 85 ? '#c0392b' : '#1a3a34'"
            font-family="'IBM Plex Mono', monospace" letter-spacing="-1">{{ data.power?.consumed_watts ?? '—' }}</text>
          <text x="90" y="97" text-anchor="middle" font-size="9" fill="#9a9490" font-family="'Sora', system-ui" letter-spacing="1.5">WATTS ACTIVOS</text>
        </svg>
      </div>

      <div class="psu-list">
        <div class="psu-row" v-for="p in data.power?.power_supplies" :key="p.name">
          <span class="psu-led" :class="p.health === 'OK' ? 'led--ok' : 'led--warn'"></span>
          <span class="psu-name">{{ p.name }}</span>
          <span class="psu-w">{{ p.power_watts ?? '—' }} W</span>
          <span class="psu-status" :class="p.health === 'OK' ? 'st--ok' : 'st--warn'">{{ p.health }}</span>
        </div>
      </div>
    </div>

    <footer class="panel-foot">
      <span class="pf-label">Capacidad total</span>
      <span class="pf-val">{{ data.power?.capacity_watts ?? '—' }} W</span>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ data: { type: Object, required: true } })

const powerPct = computed(() => {
  if (!props.data?.power?.consumed_watts || !props.data?.power?.capacity_watts) return 0
  return Math.min(100, (props.data.power.consumed_watts / props.data.power.capacity_watts) * 100)
})
</script>

<style scoped>
/* Panel chrome */
.panel { background:white; border:1.5px solid #ddd8d0; border-radius:18px; display:flex; flex-direction:column; overflow:hidden; transition:transform .18s,box-shadow .18s; }
.panel:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(26,23,20,.07); }
.panel-head { padding:18px 22px; display:flex; align-items:center; gap:12px; border-bottom:1px solid #ede9e4; background:#faf8f5; }
.ph-mark { width:3px; height:28px; border-radius:2px; flex-shrink:0; }
.ph-mark--amber { background:#e67e22; }
.ph-text { flex:1; }
.ph-title { display:block; font-size:12px; font-weight:800; color:#1a1714; text-transform:uppercase; letter-spacing:.07em; }
.ph-meta  { display:block; font-size:10px; font-weight:500; color:#9a9490; margin-top:2px; text-transform:uppercase; letter-spacing:.05em; }
.panel-body { padding:22px; flex:1; display:flex; flex-direction:column; gap:16px; }
.panel-foot { padding:12px 22px; border-top:1px solid #ede9e4; background:#faf8f5; display:flex; align-items:center; gap:10px; font-size:10px; font-weight:600; }
.pf-label { color:#9a9490; text-transform:uppercase; letter-spacing:.08em; }
.pf-val   { color:#1a1714; font-family:'IBM Plex Mono',monospace; font-size:11px; }
/* Gauge */
.gauge-wrap { display:flex; justify-content:center; }
.gauge-svg  { width:180px; height:105px; }
/* PSU list */
.psu-list { display:flex; flex-direction:column; gap:8px; }
.psu-row  { display:flex; align-items:center; gap:10px; padding:11px 14px; background:#f5f2ee; border-radius:10px; border:1px solid #ddd8d0; }
.psu-led  { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.led--ok  { background:#1a8a7a; }
.led--warn{ background:#e67e22; }
.psu-name { flex:1; font-size:11px; font-weight:600; color:#4a4540; }
.psu-w    { font-family:'IBM Plex Mono',monospace; font-size:12px; font-weight:600; color:#1a1714; }
.psu-status { font-size:9px; font-weight:700; padding:3px 8px; border-radius:5px; }
.st--ok   { background:#e6f5f2; color:#0f6e44; border-radius:5px; padding:2px 8px; font-size:9px; font-weight:700; }
.st--warn { background:#fef3e6; color:#854f0b; border-radius:5px; padding:2px 8px; font-size:9px; font-weight:700; }
</style>
