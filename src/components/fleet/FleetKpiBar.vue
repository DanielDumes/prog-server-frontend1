<template>
  <section class="kpi-bar" v-if="servers.length > 0">
    <!-- Donut chart -->
    <div class="kpi-donut-wrap">
      <Doughnut :data="chartData" :options="chartOptions" />
      <div class="kpi-donut-center">
        <span class="kdc-pct">{{ healthPct }}<small>%</small></span>
        <span class="kdc-lbl">OK</span>
      </div>
    </div>

    <div class="kpi-divider"></div>

    <!-- Stats -->
    <div class="kpi-stats">
      <div class="kpi-stat">
        <span class="ks-val ks--total">{{ servers.length }}</span>
        <span class="ks-lbl">Flota total</span>
      </div>
      <div class="kpi-stat">
        <span class="ks-val ks--ok">{{ stats.ok }}</span>
        <span class="ks-lbl">Óptimos</span>
      </div>
      <div class="kpi-stat">
        <span class="ks-val ks--warn" :class="{ 'ks-blink': stats.warn > 0 }">{{ stats.warn }}</span>
        <span class="ks-lbl">Advertencia</span>
      </div>
      <div class="kpi-stat">
        <span class="ks-val ks--crit" :class="{ 'ks-blink': stats.crit > 0 }">{{ stats.crit }}</span>
        <span class="ks-lbl">Críticos</span>
      </div>
      <div class="kpi-stat">
        <span class="ks-val ks--off">{{ stats.off }}</span>
        <span class="ks-lbl">Offline</span>
      </div>
    </div>

    <div class="kpi-divider"></div>

    <!-- Fleet health bar -->
    <div class="kpi-health-col">
      <div class="khc-label">Estado de la flota</div>
      <div class="health-bar-track">
        <div class="health-bar-seg hbs--ok"   :style="{ width: pct(stats.ok)   + '%' }" :title="`${stats.ok} óptimos`"></div>
        <div class="health-bar-seg hbs--warn"  :style="{ width: pct(stats.warn) + '%' }" :title="`${stats.warn} advertencias`"></div>
        <div class="health-bar-seg hbs--crit"  :style="{ width: pct(stats.crit) + '%' }" :title="`${stats.crit} críticos`"></div>
        <div class="health-bar-seg hbs--off"   :style="{ width: pct(stats.off)  + '%' }" :title="`${stats.off} offline`"></div>
      </div>
      <div class="health-bar-legend">
        <span class="hbl-item"><span class="hbl-dot hbl--ok"></span>OK</span>
        <span class="hbl-item"><span class="hbl-dot hbl--warn"></span>Warn</span>
        <span class="hbl-item"><span class="hbl-dot hbl--crit"></span>Crit</span>
        <span class="hbl-item"><span class="hbl-dot hbl--off"></span>Off</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  servers:      { type: Array,  default: () => [] },
  stats:        { type: Object, default: () => ({ ok:0, warn:0, crit:0, off:0 }) },
  healthPct:    { type: Number, default: 0        },
  chartData:    { type: Object, required: true    },
  chartOptions: { type: Object, required: true    },
})

function pct(n) {
  return props.servers.length ? Math.round((n / props.servers.length) * 100) : 0
}
</script>

<style scoped>
.kpi-bar { display:flex; align-items:center; background:white; border-bottom:1.5px solid #ddd8d0; padding:16px 32px; gap:28px; }
.kpi-donut-wrap   { position:relative; width:72px; height:72px; flex-shrink:0; }
.kpi-donut-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none; }
.kdc-pct  { font-family:'IBM Plex Mono',monospace; font-size:16px; font-weight:600; color:#1a1714; line-height:1; }
.kdc-pct small { font-size:10px; color:#9a9490; }
.kdc-lbl  { font-size:8px; font-weight:700; color:#9a9490; text-transform:uppercase; letter-spacing:.08em; margin-top:2px; }
.kpi-divider { width:1px; height:52px; background:#e8e4df; flex-shrink:0; }
.kpi-stats { display:flex; align-items:center; gap:24px; }
.kpi-stat  { display:flex; flex-direction:column; align-items:center; gap:3px; }
.ks-val    { font-family:'IBM Plex Mono',monospace; font-size:26px; font-weight:600; line-height:1; }
.ks-lbl    { font-size:9px; font-weight:700; color:#9a9490; text-transform:uppercase; letter-spacing:.08em; }
.ks--total { color:#1a1714; }
.ks--ok    { color:#1a8a7a; }
.ks--warn  { color:#e67e22; }
.ks--crit  { color:#c0392b; }
.ks--off   { color:#b0aba3; }
.ks-blink  { animation:blink 1.2s infinite; }
.kpi-health-col { flex:1; min-width:180px; }
.khc-label { font-size:9px; font-weight:700; color:#9a9490; text-transform:uppercase; letter-spacing:.08em; margin-bottom:8px; }
.health-bar-track { height:8px; border-radius:4px; background:#f5f2ee; overflow:hidden; display:flex; border:1px solid #e8e4df; }
.health-bar-seg   { height:100%; transition:width .6s ease; }
.hbs--ok   { background:#1a8a7a; }
.hbs--warn { background:#e67e22; }
.hbs--crit { background:#c0392b; }
.hbs--off  { background:#d4d0cb; }
.health-bar-legend { display:flex; gap:12px; margin-top:7px; }
.hbl-item  { display:flex; align-items:center; gap:4px; font-size:9px; font-weight:600; color:#9a9490; }
.hbl-dot   { width:6px; height:6px; border-radius:50%; }
.hbl--ok   { background:#1a8a7a; }
.hbl--warn { background:#e67e22; }
.hbl--crit { background:#c0392b; }
.hbl--off  { background:#d4d0cb; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
@media (max-width:900px) { .kpi-health-col { display:none; } .kpi-bar { gap:20px; } }
@media (max-width:768px) { .kpi-bar { padding:12px 16px; } }
@media (max-width:640px) { .kpi-stats { gap:16px; } }
</style>
