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

    <!-- Hardware scan banner (servidor recién agregado) -->
    <div class="hw-scan-bar" v-if="hardwareScanning && data">
      <div class="hw-scan-pulse"></div>
      <span>Escaneando inventario de hardware (memoria y almacenamiento)… esto puede tardar unos segundos en servidores nuevos.</span>
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
import { useIlo } from '../composables/useIlo.js'
import HeroStrip    from '../components/detail/HeroStrip.vue'
import CpuPanel     from '../components/detail/CpuPanel.vue'
import RamPanel     from '../components/detail/RamPanel.vue'
import PowerPanel   from '../components/detail/PowerPanel.vue'
import ThermalPanel from '../components/detail/ThermalPanel.vue'
import FansPanel    from '../components/detail/FansPanel.vue'
import StoragePanel from '../components/detail/StoragePanel.vue'
import SystemInfoPanel from '../components/detail/SystemInfoPanel.vue'

const props = defineProps({ 
  server: Object, 
  refreshCount: Number, 
  heartbeat: String,
  pushedSummaries: Array 
})
defineEmits(['back'])

const { fetchAll, fetchHardwareOnly } = useIlo()
const data           = ref(null)
const loading        = ref(true)
const error          = ref(null)
const lastUpdate     = ref('')
const hardwareScanning = ref(false)   // true mientras reintenta storage/memory

// ── Retry automático de hardware (storage + memory) ───────────────
const MAX_HW_RETRIES = 8           // 8 × 5s = 40 s máximo
let _hwRetryTimer   = null
let _hwRetryCount   = 0

function _cancelHwRetry() {
  if (_hwRetryTimer) { clearTimeout(_hwRetryTimer); _hwRetryTimer = null }
  hardwareScanning.value = false
  _hwRetryCount = 0
}

async function _retryHardware() {
  if (!data.value || _hwRetryCount >= MAX_HW_RETRIES) {
    _cancelHwRetry()
    return
  }
  try {
    const { storage, memory } = await fetchHardwareOnly(props.server)
    const gotStorage = (storage?.controllers?.length ?? 0) > 0
    const gotMemory  = (memory?.dimms?.length ?? 0) > 0
    if (gotStorage || gotMemory) {
      // Merge: aplica lo que llegó, conserva lo que ya había
      data.value = {
        ...data.value,
        storage: gotStorage ? storage : data.value.storage,
        memory:  gotMemory  ? memory  : data.value.memory,
      }
    }
    // Evaluar si YA tenemos datos en data.value (puede ser de este fetch o de uno anterior)
    // para decidir si seguimos reintentando o paramos.
    const nowHasStorage = (data.value?.storage?.controllers?.length ?? 0) > 0
    const nowHasMemory  = (data.value?.memory?.dimms?.length  ?? 0) > 0
    if (!nowHasMemory) {
      _hwRetryCount++
      _hwRetryTimer = setTimeout(_retryHardware, 5000)
    } else {
      _cancelHwRetry()
    }
  } catch {
    _hwRetryCount++
    _hwRetryTimer = setTimeout(_retryHardware, 5000)
  }
}

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
  // Cancelar cualquier retry en curso antes de una recarga
  _cancelHwRetry()
  data.value = null
  loading.value = true
  error.value = null
  try {
    // fetchAll trae summary + storage + memory (datos completos).
    // Si el summary falla (servidor recién agregado, posible race condition),
    // reintentamos hasta 3 veces con 2s de espera antes de mostrar error.
    let res = null
    const MAX_FULL_RETRIES = 3
    for (let attempt = 0; attempt < MAX_FULL_RETRIES; attempt++) {
      try {
        res = await fetchAll(props.server)
        break  // éxito
      } catch (e) {
        if (attempt < MAX_FULL_RETRIES - 1) {
          await new Promise(r => setTimeout(r, 2000))
        } else {
          throw e  // último intento: propagar el error
        }
      }
    }

    data.value = res
    if (res.last_updated) {
      let ts = res.last_updated
      if (typeof ts === 'string' && !ts.includes('Z') && !ts.includes('+')) {
        ts = ts.trim() + 'Z'
      }
      const date = new Date(ts)
      lastUpdate.value = date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
    }
    // ── Retry automático si storage O memory llegan vacíos ──────────
    // Ocurre cuando el servidor es nuevo y el deep-poll del backend
    // aún está corriendo en segundo plano.
    // aún está corriendo en segundo plano. Al usar !hasMemory asumimos
    // que la RAM y Storage se guardan juntos atómicamente. Si hay RAM
    // pero no Storage (ej. server sin discos), evitamos falsos reintentos.
    const hasMemory  = (res.memory?.dimms?.length ?? 0) > 0
    if (!hasMemory) {
      hardwareScanning.value = true
      _hwRetryTimer = setTimeout(_retryHardware, 5000)
    }
  } catch (e) { 
    error.value = `Error: ${e.message}`
  } finally { 
    loading.value = false 
  }
}

async function openConsole() {
  window.open(`https://${props.server.host}/`, '_blank')
}

// Sincronizar con el heartbeat global
watch(() => props.heartbeat, (newVal) => {
  if (newVal) lastUpdate.value = newVal
})

// Ciclo de monitoreo: MERGE en vez de reemplazar para no perder storage/memory
// Este watch NO se ejecuta al montar (no immediate) — la animación siempre se muestra
watch(() => props.pushedSummaries, (newList) => {
  if (!newList || !props.server || loading.value) return
  const fresh = newList.find(s => s.server_id === props.server.id)
  if (!fresh) return
  
  // MERGE: aplicar datos frescos del ciclo pero conservar storage y memory
  // que solo vienen del fetchAll y NO están en el pushedSummaries
  data.value = {
    ...fresh,
    storage: data.value?.storage ?? null,
    memory:  data.value?.memory  ?? null,
  }

  if (fresh.last_updated) {
    let ts = fresh.last_updated
    if (typeof ts === 'string' && !ts.includes('Z') && !ts.includes('+')) {
      ts = ts.trim() + 'Z'
    }
    const date = new Date(ts)
    lastUpdate.value = date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
  }
})

onMounted(() => { 
  load()
  if (props.heartbeat) lastUpdate.value = props.heartbeat
})

onUnmounted(() => {
  // Limpiar timer al salir de la vista para evitar memory leaks
  _cancelHwRetry()
})


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

/* ── ERROR + LOADER ── */
.err-bar   { background:#fdecea; border-bottom:1.5px solid #f5c0c0; padding:10px 36px; display:flex; align-items:center; gap:12px; font-size:12px; font-weight:600; color:#a32d2d; }
.err-retry { margin-left:auto; background:#a32d2d; color:white; border:none; padding:5px 14px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:700; }

/* ── HARDWARE SCAN BANNER ── */
.hw-scan-bar { display:flex; align-items:center; gap:10px; padding:9px 36px; background:#fffbf0; border-bottom:1.5px solid #f5e0a0; font-size:11px; font-weight:500; color:#7a5c00; }
.hw-scan-pulse { width:8px; height:8px; border-radius:50%; background:#e6a817; flex-shrink:0; animation:hw-pulse 1.4s ease-in-out infinite; }
@keyframes hw-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(1.35)} }
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

/* ── RESPONSIVE ── */
@media (max-width:1200px) { .trio-grid { grid-template-columns:1fr 1fr; } }
@media (max-width:800px)  { .trio-grid,.duo-grid { grid-template-columns:1fr; } .main { padding:18px 20px; } .topbar { padding:0 20px; } }
</style>