<template>
  <div class="fleet-page">

    <!-- Topbar -->
    <FleetTopBar
      :server-count="servers.length"
      :loading="loading"
      :countdown-sec="countdownSec"
      :countdown-pct="countdownPct"
      :last-refresh="lastRefresh"
      @open-reports="$emit('open-reports')"
      @reload-all="reloadAll"
      @add-server="showAdd = true"
    />

    <!-- Alert banners -->
    <div class="alert-crit" v-if="stats.crit > 0">
      <span class="alert-led"></span>
      <span>{{ stats.crit }} servidor{{ stats.crit > 1 ? 'es' : '' }} en estado <strong>Crítico</strong> — Requiere atención inmediata</span>
    </div>
    <div class="alert-warn" v-else-if="stats.warn > 0">
      <span class="alert-led alert-led--warn"></span>
      <span>{{ stats.warn }} servidor{{ stats.warn > 1 ? 'es' : '' }} con <strong>Advertencias</strong> activas</span>
    </div>

    <!-- KPI Bar -->
    <FleetKpiBar
      :servers="servers"
      :stats="stats"
      :health-pct="healthPct"
      :chart-data="chartData"
      :chart-options="chartOptions"
    />

    <!-- Filter Bar -->
    <FleetFilterBar
      v-if="servers.length > 0"
      :filters="filters"
      :active-filter="activeFilter"
      :sort-by="sortBy"
      :grid-mode="gridMode"
      :search-q="searchQ"
      :result-count="filteredServers.length"
      :total="servers.length"
      @update:activeFilter="activeFilter = $event"
      @update:sortBy="sortBy = $event"
      @update:gridMode="gridMode = $event"
      @update:searchQ="searchQ = $event"
    />

    <!-- Empty State -->
    <div class="empty-state" v-if="!loading && servers.length === 0">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="36" height="36">
          <rect x="2" y="2" width="20" height="8" rx="2"/>
          <rect x="2" y="14" width="20" height="8" rx="2"/>
          <line x1="6" y1="6" x2="6.01" y2="6" stroke-width="3"/>
          <line x1="6" y1="18" x2="6.01" y2="18" stroke-width="3"/>
        </svg>
      </div>
      <div class="empty-title">Sin infraestructura monitoreada</div>
      <div class="empty-sub">Conecta tus primeros servidores HPE iLO 5 para comenzar a monitorear en tiempo real.</div>
      <button class="btn-primary" @click="showAdd = true">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Añadir primer servidor
      </button>
    </div>

    <!-- Server Grid -->
    <main class="fleet-grid" :class="{ 'fleet-list': gridMode === 'list' }" v-else>
      <div class="no-results" v-if="filteredServers.length === 0">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Sin resultados para <strong>"{{ searchQ }}"</strong>
      </div>
      <ServerCard
        v-for="srv in filteredServers"
        :key="srv.id"
        :server="srv"
        :list-mode="gridMode === 'list'"
        :ref="el => { if (el) cardRefs[srv.id] = el }"
        @select="$emit('open-detail', $event)"
        @status="updateStatus(srv.id, $event)"
        @deleted="onServerDeleted"
      />
    </main>

    <!-- Add Modal -->
    <AddServerModal v-if="showAdd" @close="showAdd = false" @added="onServerAdded" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import ServerCard     from '../components/ServerCard.vue'
import AddServerModal from '../components/AddServerModal.vue'
import FleetTopBar    from '../components/fleet/FleetTopBar.vue'
import FleetKpiBar    from '../components/fleet/FleetKpiBar.vue'
import FleetFilterBar from '../components/fleet/FleetFilterBar.vue'
import { useIlo }     from '../composables/useIlo.js'
import { REFRESH_INTERVAL_SEC } from '../config/servers.js'

const props = defineProps({ refreshCount: Number })
defineEmits(['open-detail', 'open-reports'])

const { getServers } = useIlo()
const servers      = ref([])
const cardRefs     = ref({})
const showAdd      = ref(false)
const lastRefresh  = ref('')
const loading      = ref(true)
const statusMap    = ref({})
const metricsMap   = ref({})   // Bug fix: declarado para evitar ReferenceError en sort por temp/watts
const searchQ      = ref('')
const gridMode     = ref('grid')
const activeFilter = ref('all')
const sortBy       = ref('name')

let cdTimer = null
const countdownSec = ref(REFRESH_INTERVAL_SEC)

const countdownPct = computed(() => {
  const t = REFRESH_INTERVAL_SEC
  return ((t - countdownSec.value) / t) * 100
})

const stats = computed(() => {
  const s = { ok: 0, warn: 0, crit: 0, off: 0 }
  servers.value.forEach(srv => {
    const st = statusMap.value[srv.id]
    if      (st === 'ok')   s.ok++
    else if (st === 'warn') s.warn++
    else if (st === 'crit') s.crit++
    else                    s.off++
  })
  return s
})

const healthPct = computed(() => {
  if (!servers.value.length) return 0
  return Math.round((stats.value.ok / servers.value.length) * 100)
})

const filters = computed(() => [
  { key: 'ok',   label: 'Óptimos',     cls: 'green', count: stats.value.ok   },
  { key: 'warn', label: 'Advertencia', cls: 'amber', count: stats.value.warn },
  { key: 'crit', label: 'Críticos',    cls: 'red',   count: stats.value.crit },
  { key: 'off',  label: 'Offline',     cls: 'gray',  count: stats.value.off  },
])

const statusOrder = { crit: 0, warn: 1, ok: 2, off: 3 }

const filteredServers = computed(() => {
  let list = [...servers.value]
  if (activeFilter.value !== 'all') {
    list = list.filter(srv => statusMap.value[srv.id] === activeFilter.value)
  }
  if (searchQ.value.trim()) {
    const q = searchQ.value.toLowerCase()
    list = list.filter(srv =>
      srv.label.toLowerCase().includes(q) || srv.host.toLowerCase().includes(q)
    )
  }
  list.sort((a, b) => {
    if (sortBy.value === 'status') {
      return (statusOrder[statusMap.value[a.id]] ?? 4) - (statusOrder[statusMap.value[b.id]] ?? 4)
    }
    if (sortBy.value === 'temp') {
      const ta = metricsMap.value[a.id]?.temp ?? -1
      const tb = metricsMap.value[b.id]?.temp ?? -1
      return tb - ta
    }
    if (sortBy.value === 'watts') {
      const wa = metricsMap.value[a.id]?.watts ?? -1
      const wb = metricsMap.value[b.id]?.watts ?? -1
      return wb - wa
    }
    return a.label.localeCompare(b.label)
  })
  return list
})

const chartData = computed(() => {
  const { ok, warn, crit, off } = stats.value
  if (!ok && !warn && !crit && !off) {
    return { labels: ['—'], datasets: [{ data: [1], backgroundColor: ['#e8e4df'], borderWidth: 0 }] }
  }
  return {
    labels: ['Óptimos', 'Advertencia', 'Críticos', 'Offline'],
    datasets: [{
      data: [ok, warn, crit, off],
      backgroundColor: ['#1a8a7a', '#e67e22', '#c0392b', '#b0aba3'],
      hoverBackgroundColor: ['#1da898', '#f39c12', '#e74c3c', '#9a9490'],
      borderWidth: 0, hoverOffset: 6,
    }]
  }
})

const chartOptions = {
  responsive: true, maintainAspectRatio: false, cutout: '74%',
  plugins: { legend: { display: false }, tooltip: { enabled: true } }
}

async function loadServers() {
  loading.value = true
  try { servers.value = await getServers() }
  catch (e) { console.error(e) }
  finally { loading.value = false }
}

function onServerAdded(srv)  { showAdd.value = false; servers.value.push(srv) }
function onServerDeleted(id) {
  servers.value = servers.value.filter(s => s.id !== id)
  delete statusMap.value[id]
  delete metricsMap.value[id]
  delete cardRefs.value[id]
}
function updateStatus(id, status) { statusMap.value[id] = status }
function reloadAll() {
  Object.values(cardRefs.value).forEach(c => c?.reload?.())
  lastRefresh.value = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
  countdownSec.value = REFRESH_INTERVAL_SEC
}

onMounted(() => {
  loadServers()
  lastRefresh.value = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
  cdTimer = setInterval(() => { countdownSec.value = Math.max(0, countdownSec.value - 1) }, 1000)
})
watch(() => props.refreshCount, () => { reloadAll() })
onUnmounted(() => clearInterval(cdTimer))
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;600&display=swap');

.fleet-page { display:flex; flex-direction:column; min-height:100vh; background:#f5f2ee; font-family:'Sora',-apple-system,sans-serif; color:#1a1714; }

/* Alerts */
.alert-crit { display:flex; align-items:center; gap:10px; background:#fdecea; border-bottom:1.5px solid #f5c0c0; padding:10px 32px; font-size:12px; font-weight:600; color:#a32d2d; }
.alert-warn { display:flex; align-items:center; gap:10px; background:#fef3e6; border-bottom:1.5px solid #f9d5a5; padding:10px 32px; font-size:12px; font-weight:600; color:#854f0b; }
.alert-led { width:7px; height:7px; border-radius:50%; background:#c0392b; animation:blink 1s infinite; flex-shrink:0; }
.alert-led--warn { background:#e67e22; animation:none; }

/* Empty state */
.empty-state { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:80px 24px; text-align:center; }
.empty-icon  { width:72px; height:72px; border-radius:18px; background:#e6f5f2; border:1.5px solid #b8e4dc; display:flex; align-items:center; justify-content:center; color:#1a8a7a; }
.empty-title { font-size:20px; font-weight:800; color:#1a1714; letter-spacing:-.02em; }
.empty-sub   { font-size:13px; color:#9a9490; max-width:320px; line-height:1.6; }
.btn-primary { display:flex; align-items:center; gap:6px; font-family:'Sora',sans-serif; font-size:12px; font-weight:700; padding:7px 15px; border-radius:8px; background:#1a1714; color:#f5f2ee; border:none; cursor:pointer; transition:all .15s; letter-spacing:.02em; }
.btn-primary:hover { background:#2d2925; }

/* Fleet grid */
.fleet-grid { flex:1; padding:24px 32px; display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; align-items:start; }
.fleet-list { grid-template-columns:1fr; gap:8px; }
.no-results { grid-column:1/-1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:60px; color:#9a9490; font-size:13px; }
.no-results strong { color:#1a1714; }

/* Animations */
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }

/* Responsive */
@media (max-width:768px)  { .fleet-grid { padding:16px; gap:12px; } .alert-crit,.alert-warn { padding:10px 16px; } }
@media (max-width:640px)  { .fleet-grid { grid-template-columns:1fr; } }
</style>