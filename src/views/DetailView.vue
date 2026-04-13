<template>
  <div class="dp">

    <!-- ── Topbar ── -->
    <header class="topbar">
      <button class="btn-back" @click="$emit('back')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Volver
      </button>
      <div class="topbar-center" v-if="data">
        <span class="srv-name">{{ server.label }}</span>
        <span class="divider-slash">/</span>
        <span class="srv-ip">{{ server.host }}</span>
        <span class="health-tag" :class="'ht--' + healthCls(data.summary?.health)">
          <span class="ht-dot"></span>{{ healthLabel(data.summary?.health) }}
        </span>
      </div>
      <div class="topbar-right">
        <span class="last-sync" v-if="lastUpdate" :class="{ 'sync--refreshing': loading }">
          <span class="sync-dot" v-if="loading"></span>
          ↺ {{ lastUpdate }}
        </span>
        <button class="btn-console-main" @click="openConsole" title="Acceso iLO (HTML5)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          Acceso iLO
        </button>
      </div>
    </header>

    <!-- Error -->
    <div class="err-bar" v-if="error">
      <span>⚠ {{ error }}</span>
      <button @click="load" class="err-retry">Reintentar</button>
    </div>

    <!-- Loader -->
    <div class="page-loader" v-if="loading && !data">
      <div class="loader-track"><div class="loader-car"></div></div>
      <div class="loader-msg">Conectando con <strong>{{ server.host }}</strong>…</div>
    </div>

    <!-- Main Content -->
    <main class="main" v-if="data">
      <!-- Hero strip -->
      <HeroStrip
        :data="data"
        :ambient-temp="ambientTemp"
        :ambient-temp-name="ambientTempName"
        :ambient-temp-cls="ambientTempCls"
      />

      <!-- CPU + RAM + Power -->
      <section class="trio-grid">
        <CpuPanel   :data="data" />
        <RamPanel   :data="data" />
        <PowerPanel :data="data" />
      </section>

      <!-- Temps + Fans -->
      <section class="duo-grid">
        <ThermalPanel :data="data" />
        <FansPanel    :data="data" />
      </section>

      <!-- Storage + System Info -->
      <section class="duo-grid">
        <StoragePanel    :data="data" />
        <SystemInfoPanel :data="data" :server="server" />
      </section>
    </main>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useIlo }            from '../composables/useIlo.js'
import { REFRESH_INTERVAL_SEC } from '../config/servers.js'
import HeroStrip    from '../components/detail/HeroStrip.vue'
import CpuPanel     from '../components/detail/CpuPanel.vue'
import RamPanel     from '../components/detail/RamPanel.vue'
import PowerPanel   from '../components/detail/PowerPanel.vue'
import ThermalPanel from '../components/detail/ThermalPanel.vue'
import FansPanel    from '../components/detail/FansPanel.vue'
import StoragePanel from '../components/detail/StoragePanel.vue'
import SystemInfoPanel from '../components/detail/SystemInfoPanel.vue'

const props = defineProps({ server: Object, refreshCount: Number })
defineEmits(['back'])

const { fetchAll } = useIlo()
const data       = ref(null)
const loading    = ref(true)
const error      = ref(null)
const lastUpdate = ref('')

let autoTimer    = null

// ── Computed para HeroStrip ───────────────────────────────────────
const ambientTempSensor = computed(() => {
  const sensors = data.value?.temperatures ?? []
  if (!sensors.length) return null
  return sensors.find(s => {
    const n = (s.name || '').toLowerCase()
    return n.includes('inlet') || n.includes('ambient')
  }) || null
})
const ambientTemp = computed(() => {
  if (ambientTempSensor.value?.reading_c != null) return ambientTempSensor.value.reading_c
  const vals = (data.value?.temperatures ?? []).map(t => t.reading_c).filter(v => v != null)
  return vals.length ? Math.max(...vals) : null
})
const ambientTempName = computed(() => {
  if (ambientTempSensor.value) return ambientTempSensor.value.name
  if (!data.value?.temperatures?.length) return 'Sin sensores'
  const s = data.value.temperatures.reduce((a, b) => (b.reading_c ?? -999) > (a.reading_c ?? -999) ? b : a)
  return s?.name ?? 'Sensor de reserva'
})
const ambientTempCls = computed(() => {
  if (ambientTemp.value === null) return ''
  if (ambientTemp.value > 80) return 'crit'
  if (ambientTemp.value > 65) return 'warn'
  return 'ok'
})

// ── Helpers topbar ────────────────────────────────────────────────
function healthLabel(h) { return { OK: 'Óptimo', Warning: 'Advertencia', Critical: 'Crítico' }[h] ?? h ?? '—' }
function healthCls(h)   { return { OK: 'ok', Warning: 'warn', Critical: 'crit' }[h] ?? '' }

// ── DATA LOADING ──────────────────────────────────────────────────
async function load() {
  loading.value = true; error.value = null
  try {
    data.value = await fetchAll(props.server)
    lastUpdate.value = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
  } catch (e) { 
    error.value = `Error: ${e.message}`
  } finally { 
    loading.value = false 
  }
}

async function openConsole() {
  window.open(`https://${props.server.host}/`, '_blank')
}

function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text)
  // Opcional: podrías disparar un toast aquí si tuvieras un sistema de notificaciones
}

// Bug fix: responder al refreshCount del padre (socket events)
watch(() => props.refreshCount, () => load())

onMounted(() => { load(); autoTimer = setInterval(load, REFRESH_INTERVAL_SEC * 1000) })
onUnmounted(() => { clearInterval(autoTimer) })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;600&display=swap');

.dp  { min-height:100vh; background:#f5f2ee; font-family:'Sora',-apple-system,sans-serif; color:#1a1714; }
.mono { font-family:'IBM Plex Mono',monospace; }

/* ── TOPBAR ── */
.topbar { position:sticky; top:0; z-index:100; background:#faf8f5; border-bottom:1.5px solid #ddd8d0; height:60px; padding:0 36px; display:flex; align-items:center; gap:16px; }
.btn-back { display:flex; align-items:center; gap:6px; font-family:'Sora',sans-serif; font-size:12px; font-weight:600; padding:7px 14px; border-radius:8px; border:1.5px solid #d4cfc8; background:white; color:#6b6560; cursor:pointer; transition:all .15s; letter-spacing:.02em; white-space:nowrap; }
.btn-back:hover { background:#f5f2ee; border-color:#b0aba3; color:#1a1714; }
.topbar-center { display:flex; align-items:center; gap:10px; }
.srv-name { font-size:15px; font-weight:800; color:#1a1714; letter-spacing:-.03em; }
.divider-slash { color:#c4bfb8; font-weight:300; font-size:16px; }
.srv-ip { font-family:'IBM Plex Mono',monospace; font-size:11px; color:#1a8a7a; background:#e6f5f2; padding:3px 8px; border-radius:5px; border:1px solid #b8e4dc; }
.health-tag { display:flex; align-items:center; gap:5px; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; letter-spacing:.02em; }
.ht-dot { width:6px; height:6px; border-radius:50%; }
.ht--ok   { background:#e6f5ee; color:#0f6e44; } .ht--ok   .ht-dot { background:#1a8a7a; }
.ht--warn { background:#fef3e6; color:#854f0b; } .ht--warn .ht-dot { background:#e67e22; }
.ht--crit { background:#fdecea; color:#a32d2d; } .ht--crit .ht-dot { background:#c0392b; animation:blink 1s infinite; }
.topbar-right { margin-left:auto; display:flex; align-items:center; gap:12px; }
.last-sync { font-size:11px; color:#9a9490; font-weight:500; display:flex; align-items:center; gap:6px; }
.sync--refreshing { color: #1a8a7a; }
.sync-dot { width: 6px; height: 6px; border-radius: 50%; background: #1a8a7a; animation: sync-blink 1s infinite; }
@keyframes sync-blink { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.2); } }
.btn-sync { display:flex; align-items:center; gap:7px; font-family:'Sora',sans-serif; font-size:12px; font-weight:700; padding:8px 18px; border-radius:8px; background:#1a1714; color:#f5f2ee; border:none; cursor:pointer; letter-spacing:.02em; transition:all .15s; }
.btn-sync:hover { background:#2d2925; }
.btn-sync:disabled { opacity:.5; cursor:not-allowed; }

.btn-console-main {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 700;
  padding: 8px 18px; border-radius: 8px;
  background: white; color: #1a8a7a;
  border: 1.5px solid #1a8a7a; cursor: pointer;
  letter-spacing: .02em; transition: all .2s;
}
.btn-console-main:hover {
  background: #1a8a7a; color: white;
  box-shadow: 0 4px 12px rgba(26,138,122,0.2);
}
.btn-console-main:hover svg { transform: scale(1.1); }

.btn-console-jirc-main { color: #8e44ad; border-color: #8e44ad; }
.btn-console-jirc-main:hover {
  background: #8e44ad; color: white;
  box-shadow: 0 4px 12px rgba(142,68,173,0.3);
}

/* ── ERROR + LOADER ── */
.err-bar   { background:#fdecea; border-bottom:1.5px solid #f5c0c0; padding:10px 36px; display:flex; align-items:center; gap:12px; font-size:12px; font-weight:600; color:#a32d2d; }
.err-retry { margin-left:auto; background:#a32d2d; color:white; border:none; padding:5px 14px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:700; }
.page-loader { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; height:calc(100vh - 60px); }
.loader-track { width:240px; height:3px; background:#e0dbd4; border-radius:2px; overflow:hidden; }
.loader-car   { width:80px; height:3px; background:#1a8a7a; border-radius:2px; animation:slide 1.4s ease-in-out infinite; }
.loader-msg   { font-size:13px; color:#6b6560; font-weight:500; }

/* ── LAYOUT ── */
.main { padding:28px 36px; display:flex; flex-direction:column; gap:20px; max-width:1700px; margin:0 auto; }
.trio-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
.duo-grid  { display:grid; grid-template-columns:3fr 2fr; gap:20px; }

/* ── ANIMATIONS ── */
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.25} }
@keyframes slide { 0%{transform:translateX(-100%)} 50%{transform:translateX(200%)} 100%{transform:translateX(-100%)} }
.spin { display:inline-block; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* Transitions */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%) scale(0.9); opacity: 0; }

@keyframes slideUp { from { transform: translateY(100%) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }

/* ── RESPONSIVE ── */
@media (max-width:1200px) { .trio-grid { grid-template-columns:1fr 1fr; } }
@media (max-width:800px)  { .trio-grid,.duo-grid { grid-template-columns:1fr; } .main { padding:18px 20px; } .topbar { padding:0 20px; } .cred-helper { right: 10px; left: 10px; bottom: 10px; width: auto; } }
</style>