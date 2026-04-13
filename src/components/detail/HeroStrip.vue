<template>
  <section class="hero-strip">
    <!-- Salud del Sistema -->
    <div class="hero-tile" :class="'tile--' + healthCls(data.summary?.health)">
      <div class="tile-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      </div>
      <div class="tile-body">
        <div class="tile-label">Salud del Sistema</div>
        <div class="tile-value">{{ healthLabel(data.summary?.health) }}</div>
        <div class="tile-sub">{{ data.summary?.model }}</div>
      </div>
    </div>

    <!-- Estado de Energía -->
    <div class="hero-tile" :class="data.summary?.power_state === 'On' ? 'tile--ok' : 'tile--crit'">
      <div class="tile-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg>
      </div>
      <div class="tile-body">
        <div class="tile-label">Estado de Energía</div>
        <div class="tile-value">{{ data.summary?.power_state ?? '—' }}</div>
        <div class="tile-sub">{{ data.summary?.power_state === 'On' ? 'Sistema activo' : 'Apagado' }}</div>
      </div>
    </div>

    <!-- Consumo Activo o Memoria RAM (iLO 4) -->
    <div class="hero-tile tile--info">
      <template v-if="!isIlo4MissingPower">
        <div class="tile-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div class="tile-body">
          <div class="tile-label">Consumo Activo</div>
          <div class="tile-value">{{ data.power?.consumed_watts ?? '—' }}<small> W</small></div>
          <div class="tile-sub">Cap. {{ data.power?.capacity_watts ?? '?' }} W</div>
        </div>
      </template>
      <template v-else>
        <div class="tile-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 5V3M10 5V3M14 5V3M18 5V3M6 19v2M10 19v2M14 19v2M18 19v2"/></svg>
        </div>
        <div class="tile-body">
          <div class="tile-label">Memoria RAM</div>
          <div class="tile-value">{{ data.summary?.memory_gib ?? '—' }}<small> GB</small></div>
          <div class="tile-sub">Memoria disponible</div>
        </div>
      </template>
    </div>

    <!-- Temperatura Ambiente -->
    <div class="hero-tile" :class="'tile--' + ambientTempCls">
      <div class="tile-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
      </div>
      <div class="tile-body">
        <div class="tile-label">Temperatura Ambiente</div>
        <div class="tile-value">{{ ambientTemp !== null ? ambientTemp + ' °C' : '—' }}</div>
        <div class="tile-sub">{{ ambientTempName }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  data:           { type: Object,  required: true },
  ambientTemp:    { type: Number,  default: null  },
  ambientTempName:{ type: String,  default: ''    },
  ambientTempCls: { type: String,  default: ''    },
})

const isIlo4MissingPower = computed(() => {
  const isIlo4 = props.data.ilo_gen === 4 || (props.data.summary?.model || '').toUpperCase().includes('GEN8') || (props.data.summary?.model || '').toUpperCase().includes('GEN9')
  const hasNoPower = !props.data.power?.consumed_watts || props.data.power?.consumed_watts === 0
  return isIlo4 && hasNoPower
})

function healthLabel(h) { return { OK: 'Óptimo', Warning: 'Advertencia', Critical: 'Crítico' }[h] ?? h ?? '—' }
function healthCls(h)   { return { OK: 'ok', Warning: 'warn', Critical: 'crit' }[h] ?? '' }
</script>

<style scoped>
.hero-strip { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.hero-tile  { background:white; border:1.5px solid #ddd8d0; border-radius:16px; padding:20px; display:flex; gap:14px; align-items:flex-start; transition:transform .18s,box-shadow .18s; position:relative; overflow:hidden; }
.hero-tile::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:16px 16px 0 0; }
.tile--ok::before   { background:#1a8a7a; }
.tile--warn::before { background:#e67e22; }
.tile--crit::before { background:#c0392b; }
.tile--info::before { background:#2563eb; }
.hero-tile:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(26,23,20,.08); }
.tile-icon { width:40px; height:40px; border-radius:10px; background:#f5f2ee; border:1.5px solid #ddd8d0; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#6b6560; }
.tile--ok   .tile-icon { background:#e6f5f2; border-color:#b8e4dc; color:#1a8a7a; }
.tile--warn .tile-icon { background:#fef3e6; border-color:#f9d5a5; color:#e67e22; }
.tile--crit .tile-icon { background:#fdecea; border-color:#f5c0c0; color:#c0392b; }
.tile--info .tile-icon { background:#e6f0fb; border-color:#b5d0f4; color:#2563eb; }
.tile-label { font-size:10px; font-weight:700; color:#9a9490; text-transform:uppercase; letter-spacing:.09em; }
.tile-value { font-size:22px; font-weight:800; color:#1a1714; margin-top:4px; line-height:1; letter-spacing:-.03em; }
.tile-value small { font-size:13px; font-weight:600; color:#6b6560; }
.tile--ok   .tile-value { color:#0f6e44; }
.tile--warn .tile-value { color:#854f0b; }
.tile--crit .tile-value { color:#a32d2d; }
.tile--info .tile-value { color:#185fa5; }
.tile-sub { font-size:11px; color:#9a9490; font-weight:500; margin-top:5px; }
@media (max-width:1200px) { .hero-strip { grid-template-columns:1fr 1fr; } }
@media (max-width:800px)  { .hero-strip { grid-template-columns:1fr; } }
</style>
