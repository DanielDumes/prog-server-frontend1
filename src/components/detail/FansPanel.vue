<template>
  <div class="panel">
    <header class="panel-head">
      <div class="ph-mark ph-mark--teal"></div>
      <div class="ph-text">
        <span class="ph-title">Ventilación</span>
        <span class="ph-meta">{{ activeFans.length }} ventiladores activos</span>
      </div>
    </header>
    <div class="panel-body">
      <div class="fan-grid" v-if="activeFans.length">
        <div class="fan-card" v-for="f in activeFans" :key="f.name">
          <div class="fan-rotor" :class="{ 'fan-spin': f.rpm != null && f.rpm > 0 }" :style="{ animationDuration: fanDuration(f.rpm, f.units) }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0-8C6.5 4 4 7.6 4 12s2.5 8 8 8 8-3.6 8-8-3.6-8-8-8z"/>
            </svg>
          </div>
          <div class="fan-info">
            <div class="fan-name">{{ f.name }}</div>
            <div class="fan-rpm" :class="f.health !== 'OK' ? 'rpm--warn' : ''">
              <template v-if="f.rpm != null">
                {{ f.rpm }}<span class="rpm-unit"> {{ f.displayUnits }}</span>
              </template>
              <template v-else>
                <span class="rpm-na">{{ isIlo4 ? 'OK' : 'N/A' }}</span>
              </template>
            </div>
          </div>
          <span class="fan-led" :class="f.health === 'OK' ? 'led--ok' : 'led--warn'"></span>
        </div>
      </div>
      <div class="fan-empty" v-else>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
          <path d="M12 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0-8C6.5 4 4 7.6 4 12s2.5 8 8 8 8-3.6 8-8-3.6-8-8-8z"/>
        </svg>
        <span>Sin datos de ventiladores</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ data: { type: Object, required: true } })

// iLO 4 usa FanName en vez de Name, y puede no reportar RPM (sino Percent).
const activeFans = computed(() =>
  (props.data.fans ?? []).filter(f => f.name != null).map(f => ({
    ...f,
    displayUnits: f.units === 'Percent' ? '%' : (f.units || 'RPM')
  }))
)

const isIlo4 = computed(() => {
  if (props.data.ilo_gen === 4) return true
  const model = (props.data.summary?.model || '').toUpperCase().replace(/ /g, '').replace(/-/g, '')
  return model.includes('GEN8') || model.includes('GEN9')
})

function fanDuration(val, units) {
  if (val == null || val === 0) return '2s'
  // Si es porcentaje (0-100), escalamos para la animación
  const speed = units === 'Percent' ? val * 50 : val
  return `${Math.max(0.3, 3 - (speed / 2500)).toFixed(2)}s`
}
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
.panel-body { padding:22px; flex:1; display:flex; flex-direction:column; gap:16px; }
/* Fan grid */
.fan-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.fan-card { display:flex; align-items:center; gap:12px; padding:12px 14px; background:#f5f2ee; border-radius:12px; border:1px solid #ddd8d0; }
.fan-rotor { width:36px; height:36px; background:#e6f5f2; color:#1a8a7a; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.fan-spin { animation:spin linear infinite; }
.fan-info { flex:1; min-width:0; }
.fan-name { font-size:9px; font-weight:700; color:#9a9490; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:.04em; }
.fan-rpm  { font-family:'IBM Plex Mono',monospace; font-size:15px; font-weight:600; color:#1a1714; margin-top:2px; }
.rpm-unit { font-size:9px; color:#9a9490; }
.rpm-na   { font-size:12px; color:#9a9490; font-weight:500; }
.rpm--warn { color:#854f0b; }
.fan-led  { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.led--ok  { background:#1a8a7a; }
.led--warn{ background:#e67e22; }
.fan-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:32px 16px; color:#9a9490; font-size:12px; text-align:center; }
@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
</style>
