<template>
  <div class="reports-page">

    <!-- Topbar -->
    <header class="topbar">
      <button class="btn-back" @click="$emit('back')">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Volver
      </button>
      <div class="topbar-left">
        <span class="topbar-title">Auditoría y Reportes</span>
        <span class="topbar-sub">Monitoreo Automático · MongoDB</span>
      </div>

      <div class="tab-bar">
        <button
          v-for="tab in tabs" :key="tab.key"
          class="tab-btn" :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>

      <div class="topbar-right">
      </div>
    </header>

    <!-- Pestaña 1: Resumen Semanal -->
    <WeeklyTab
      v-if="activeTab === 'weekly'"
      :loading="loadingWeekly"
      :error="weeklyError"
      :weekly="weekly"
      :filtered-weekly-logs="filteredWeeklyLogs"
    />

    <!-- Pestaña 2: Historial por Día -->
    <HistoryTab
      v-if="activeTab === 'history'"
      :history-days="historyDays"
      :selected-date="selectedDate"
      :loading-day="loadingDay"
      :day-data="dayData"
      :hourly-data="hourlyData"
      :loading-hourly="loadingHourly"
      :history-search="historySearch"
      :filtered-snapshots="filteredSnapshots"
      :unique-snapshot-servers="uniqueSnapshotServers"
      :calendar-grid="calendarGrid"
      :current-month="currentMonth"
      :current-year="currentYear"
      :month-names="monthNames"
      :week-days="weekDays"
      @load-day="loadDay"
      @view-snapshot="viewSnapshot"
      @update:historySearch="historySearch = $event"
      @change-month="changeMonth"
      @reset-today="resetToToday"
    />

    <!-- Pestaña 3: Tendencias -->
    <TrendsTab
      v-if="activeTab === 'trends'"
      :loading="loadingMetrics"
      :srv-list="srvList"
      :selected-metric-srv="selectedMetricSrv"
      :metric-days="metricDays"
      :metric-points="metricPoints"
      :temp-chart-data="tempChartData"
      :power-chart-data="powerChartData"
      :chart-options="chartOptions"
      @update:selectedMetricSrv="selectedMetricSrv = $event; fetchMetrics()"
      @update:metricDays="metricDays = $event"
      @fetch-metrics="fetchMetrics"
    />

    <!-- Snapshot inspector -->
    <SnapshotModal :snap="inspectSnap" @close="inspectSnap = null" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { BACKEND_URL }         from '../config/servers.js'
import { useIlo }              from '../composables/useIlo.js'
import WeeklyTab               from '../components/reports/WeeklyTab.vue'
import HistoryTab              from '../components/reports/HistoryTab.vue'
import TrendsTab               from '../components/reports/TrendsTab.vue'
import SnapshotModal           from '../components/reports/SnapshotModal.vue'

defineEmits(['back'])

// ── State ────────────────────────────────────────────────────────
const activeTab = ref('weekly')
const tabs = [
  { key: 'weekly',  label: 'Resumen Semanal',     icon: '📊' },
  { key: 'history', label: 'Historial por Día',   icon: '📅' },
  { key: 'trends',  label: 'Tendencias y Métricas', icon: '📈' },
]

const { getServers } = useIlo()
const srvList = ref([])

// Weekly
const loadingWeekly = ref(true)
const weeklyError   = ref(null)
const weekly        = ref({})

// History
const loadingHistory = ref(false)
const historyDays    = ref([])
const selectedDate   = ref(null)
const loadingDay     = ref(false)
const dayData        = ref(null)
const loadingHourly  = ref(false)
const hourlyData     = ref(null)
const historySearch  = ref('')
const inspectSnap    = ref(null)

// Calendario
const currentMonth = ref(new Date().getMonth())
const currentYear  = ref(new Date().getFullYear())
const monthNames   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const weekDays     = ['D','L','M','M','J','V','S']

const calendarGrid = computed(() => {
  const year = currentYear.value, month = currentMonth.value
  const firstDay = new Date(year, month, 1)
  const startDay = firstDay.getDay()
  const lastDay  = new Date(year, month + 1, 0).getDate()
  const prevLastDay = new Date(year, month, 0).getDate()
  const grid = []
  const dataMap = historyDays.value.reduce((acc, d) => { acc[d.date] = d; return acc }, {})
  for (let i = startDay; i > 0; i--) grid.push({ dayNum: prevLastDay - i + 1, isCurrentMonth: false, dateString: null })
  for (let d = 1; d <= lastDay; d++) {
    const ds   = `${year}-${(month+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`
    const info = dataMap[ds]
    grid.push({ dayNum: d, isCurrentMonth: true, dateString: ds, hasData: !!info, hasEvents: info ? info.events > 0 : false })
  }
  const remaining = 42 - grid.length
  for (let i = 1; i <= remaining; i++) grid.push({ dayNum: i, isCurrentMonth: false, dateString: null })
  return grid
})

const filteredSnapshots = computed(() => {
  if (!dayData.value?.snapshots) return []
  const q = historySearch.value.toLowerCase().trim()
  if (!q) return dayData.value.snapshots
  return dayData.value.snapshots.filter(s =>
    (s.server_label || '').toLowerCase().includes(q) || (s.server_host || '').toLowerCase().includes(q)
  )
})

const uniqueSnapshotServers = computed(() => {
  if (!dayData.value?.snapshots) return []
  return Array.from(new Set(dayData.value.snapshots.map(s => s.server_id)))
})

const filteredWeeklyLogs = computed(() => {
  if (!weekly.value.logs) return []
  return weekly.value.logs.filter(l => l.type !== 'ConnectionLoss')
})

// Metrics
const loadingMetrics    = ref(false)
const selectedMetricSrv = ref(null)
const metricDays        = ref(7)
const metricPoints      = ref([])

// ── Charts ────────────────────────────────────────────────────────
const tempChartData = computed(() => ({
  labels: metricPoints.value.map(p => new Date(p.ts).toLocaleString('es-EC', {
    timeZone: 'America/Guayaquil', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
  })),
  datasets: [{ label: 'Temp. Ambiente (°C)', data: metricPoints.value.map(p => p.avg_temp), borderColor: '#E03535', backgroundColor: 'rgba(224,53,53,0.1)', tension: 0.4, fill: true, pointRadius: 2 }]
}))
const powerChartData = computed(() => ({
  labels: metricPoints.value.map(p => new Date(p.ts).toLocaleString('es-EC', {
    timeZone: 'America/Guayaquil', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
  })),
  datasets: [{ label: 'Consumo Promedio (W)', data: metricPoints.value.map(p => p.avg_power), borderColor: '#3E92EF', backgroundColor: 'rgba(62,146,239,0.1)', tension: 0.4, fill: true, pointRadius: 2 }]
}))
const chartOptions = {
  responsive: true, maintainAspectRatio: false,
  scales: {
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748B', font: { size: 10 } } },
    x: { display: false }
  },
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: 'rgba(10,14,24,0.9)', titleFont: { size: 11 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 6 }
  }
}

// ── Fetch ─────────────────────────────────────────────────────────
async function fetchWeekly() {
  loadingWeekly.value = true; weeklyError.value = null
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/weekly`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    weekly.value = data
  } catch(e) { weeklyError.value = e.message }
  finally { loadingWeekly.value = false }
}

async function fetchHistory() {
  loadingHistory.value = true
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/history`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    historyDays.value = data.days
  } catch(e) { console.error('Error cargando historial:', e.message) }
  finally { loadingHistory.value = false }
}

async function loadDay(date) {
  selectedDate.value = date; loadingDay.value = true; dayData.value = null; hourlyData.value = null
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/daily?date=${date}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    dayData.value = data
    fetchHourly(date)
  } catch(e) { console.error('Error cargando día:', e.message) }
  finally { loadingDay.value = false }
}

async function fetchHourly(date) {
  loadingHourly.value = true
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/hourly?date=${date}`)
    const data = await res.json()
    hourlyData.value = data.data
  } catch(e) { console.error('Error cargando grid horario:', e) }
  finally { loadingHourly.value = false }
}

async function fetchMetrics() {
  loadingMetrics.value = true
  try {
    let url = `${BACKEND_URL}/api/reports/metrics?days=${metricDays.value}`
    if (selectedMetricSrv.value) url += `&server_id=${selectedMetricSrv.value}`
    const res = await fetch(url)
    const data = await res.json()
    metricPoints.value = data.points
  } catch(e) { console.error('Error fetching metrics:', e) }
  finally { loadingMetrics.value = false }
}

function viewSnapshot(snap) { inspectSnap.value = snap }

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'history' && historyDays.value.length === 0) fetchHistory()
  if (tab === 'trends'  && metricPoints.value.length === 0) fetchMetrics()
}

function changeMonth(delta) {
  currentMonth.value += delta
  if (currentMonth.value > 11) { currentMonth.value = 0; currentYear.value++ }
  else if (currentMonth.value < 0) { currentMonth.value = 11; currentYear.value-- }
}
function resetToToday() { currentMonth.value = new Date().getMonth(); currentYear.value = new Date().getFullYear() }

onMounted(async () => { fetchWeekly(); srvList.value = await getServers() })
</script>

<style scoped>
.reports-page { min-height:100vh; display:flex; flex-direction:column; background:var(--page); }
/* Topbar */
.topbar { background:rgba(255,255,255,0.85); border-bottom:1px solid var(--border); padding:0 24px; height:64px; display:flex; align-items:center; gap:16px; flex-wrap:nowrap; position:sticky; top:0; z-index:40; backdrop-filter:blur(20px); }
.btn-back { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:500; padding:6px 14px; border-radius:8px; border:1px solid transparent; background:rgba(0,0,0,0.03); color:var(--text-2); cursor:pointer; transition:all .2s; flex-shrink:0; }
.btn-back svg { width:16px; height:16px; stroke:var(--text-2); }
.btn-back:hover { background:rgba(0,0,0,0.06); color:var(--text); border-color:rgba(0,0,0,0.1); }
.topbar-left { flex-shrink:0; }
.topbar-title { font-size:16px; font-weight:600; color:var(--text); display:block; }
.topbar-sub   { font-size:10px; color:var(--text-3); text-transform:uppercase; letter-spacing:0.1em; }
.topbar-right { margin-left:auto; display:flex; align-items:center; gap:8px; flex-shrink:0; }
/* Tabs */
.tab-bar { display:flex; gap:4px; background:rgba(0,0,0,0.03); padding:4px; border-radius:10px; border:1px solid var(--border); }
.tab-btn { display:flex; align-items:center; gap:6px; padding:6px 14px; border-radius:7px; font-size:13px; font-weight:500; color:var(--text-3); cursor:pointer; border:none; background:transparent; transition:all .2s; }
.tab-btn .tab-icon { font-size:14px; }
.tab-btn:hover { color:var(--text); background:rgba(0,0,0,0.05); }
.tab-btn.active { background:rgba(62,146,239,0.18); color:var(--blue-400); border:1px solid rgba(62,146,239,0.3); }
/* Buttons */
.btn { font-size:13px; font-weight:500; padding:7px 14px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:var(--text-2); cursor:pointer; font-family:inherit; transition:all .2s; white-space:nowrap; backdrop-filter:blur(8px); }
.btn--primary { background:var(--grad-blue); color:#fff; border:1px solid rgba(59,130,246,0.3); box-shadow:0 4px 12px rgba(37,99,235,0.2); }
.btn--primary:hover { box-shadow:0 6px 16px rgba(37,99,235,0.3); filter:brightness(1.05); }
.btn--ghost { background:rgba(0,0,0,0.03); }
.btn--ghost:hover { background:rgba(0,0,0,0.07); }
.btn:disabled { opacity:.45; cursor:wait; }
.spin { display:inline-block; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
