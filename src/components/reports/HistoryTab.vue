<template>
  <div class="history-layout">
    <!-- Sidebar: Calendario -->
    <aside class="day-sidebar">
      <div class="calendar-header">
        <button class="cal-nav" @click="$emit('change-month', -1)">‹</button>
        <div class="cal-title" @click="$emit('reset-today')" title="Ir a hoy">
          {{ monthNames[currentMonth] }} {{ currentYear }}
        </div>
        <button class="cal-nav" @click="$emit('change-month', 1)">›</button>
      </div>

      <div class="calendar-grid">
        <div class="cal-weekday" v-for="wd in weekDays" :key="wd">{{ wd }}</div>
        <div
          v-for="(day, idx) in calendarGrid" :key="idx"
          class="cal-day"
          :class="{
            'off': !day.isCurrentMonth,
            'has-data': day.hasData,
            'has-events': day.hasEvents,
            'active': selectedDate === day.dateString,
            'today': isToday(day.dateString)
          }"
          @click="day.hasData && $emit('load-day', day.dateString)"
        >
          <span class="cal-num">{{ day.dayNum }}</span>
          <div class="cal-dots" v-if="day.hasData">
            <span class="dot-data"></span>
            <span class="dot-event" v-if="day.hasEvents"></span>
          </div>
        </div>
      </div>

      <div class="calendar-legend">
        <div class="leg-item"><span class="dot-data"></span> Datos</div>
        <div class="leg-item"><span class="dot-event"></span> Eventos</div>
      </div>

      <div class="history-search-wrap">
        <input type="text" :value="historySearch" @input="$emit('update:historySearch', $event.target.value)" placeholder="Buscar en el día..." class="mini-search">
      </div>
    </aside>

    <!-- Main content -->
    <main class="day-main">
      <div v-if="!selectedDate" class="center-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <p>Selecciona un día del panel izquierdo</p>
      </div>

      <div v-else-if="loadingDay" class="center-loader">
        <div class="spinner"></div> Cargando datos del {{ selectedDate }}…
      </div>

      <template v-else-if="dayData">
        <div class="day-main-header">
          <h2 class="day-main-title">{{ formatDateLong(dayData.date) }}</h2>
          <div class="fleet-status-summary" v-if="dayData.fleet">
            <span class="fss-item"><strong>{{ dayData.fleet.length }}</strong> Servidores en total</span>
            <span class="fss-item"><strong>{{ uniqueSnapshotServers.length }}</strong> Con actividad hoy</span>
            <span class="fss-item crit" v-if="dayData.fleet.length > uniqueSnapshotServers.length">
              <strong>{{ dayData.fleet.length - uniqueSnapshotServers.length }}</strong> Sin datos registrados
            </span>
          </div>
        </div>

        <!-- Hourly heatmap -->
        <div class="panel status-grid-panel" style="margin-bottom:24px">
          <div class="panel-header">
            <div class="panel-title">Estado de Salud por Hora — Disponibilidad</div>
            <div class="panel-badge-count">00:00 - 23:59</div>
          </div>
          <div class="hourly-grid-wrap" v-if="hourlyData">
            <table class="hourly-table">
              <thead>
                <tr>
                  <th>Servidor</th>
                  <th v-for="h in 24" :key="h" class="th-h">{{ (h-1).toString().padStart(2,'0') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(info, sid) in hourlyData" :key="sid">
                  <td class="td-srv-name">{{ info.label }}</td>
                  <td v-for="h in 24" :key="h" class="td-h">
                    <div class="h-cell" :class="cellCls(info.hours[h-1])" :title="`Hora ${(h-1)}:00 - ${info.hours[h-1] || 'Sin datos'}`"></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else-if="loadingHourly" class="center-loader" style="padding:40px">
            <div class="spinner"></div> Calculando disponibilidad…
          </div>
        </div>

        <!-- Timeline filter -->
        <div class="timeline-controls" v-if="dayData.snapshots?.length">
          <div class="search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" :value="historySearch" @input="$emit('update:historySearch', $event.target.value)" placeholder="Filtrar por nombre o IP de servidor...">
          </div>
          <div class="timeline-stats">{{ filteredSnapshots.length }} reporte(s) encontrados</div>
        </div>

        <!-- Snapshot table -->
        <div class="panel list-panel" v-if="filteredSnapshots.length">
          <div class="table-wrap">
            <table class="report-table">
              <thead>
                <tr><th>Hora</th><th>Servidor</th><th>Estado</th><th>Energía</th><th>Temp</th><th>Acción</th></tr>
              </thead>
              <tbody>
                <tr v-for="snap in filteredSnapshots" :key="snap._id">
                  <td class="td-time">{{ formatTimeOnly(snap.timestamp) }}</td>
                  <td>
                    <div class="td-srv-info">
                      <span class="label-badge">{{ snap.server_label }}</span>
                      <span class="host-badge-small">{{ snap.server_host }}</span>
                    </div>
                  </td>
                  <td>
                    <div v-if="snap.reachable" class="snap-health-row">
                      <span class="health-dot" :class="healthCls(snap.health)"></span>
                      {{ healthLabel(snap.health) }}
                    </div>
                    <span v-else class="tc-off">Offline</span>
                  </td>
                  <td>
                    <span v-if="snap.reachable" :class="snap.power_state === 'On' ? 'tc-ok' : 'tc-off'">{{ snap.power_state }}</span>
                    <span v-else>—</span>
                  </td>
                  <td>
                    <span v-if="snap.reachable" :class="tempCls(snap.max_temp_c)">{{ snap.max_temp_c ?? '—' }}°</span>
                    <span v-else>—</span>
                  </td>
                  <td>
                    <button class="btn-inspect" @click="$emit('view-snapshot', snap)">Inspeccionar Reporte →</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="empty-log" style="margin-top:32px">
          No se encontraron reportes que coincidan con la búsqueda.
        </div>

        <!-- Audit logs -->
        <div class="audit-section" v-if="dayData.events?.length">
          <div class="section-divider"><span>REGISTROS DETALLADOS DE EVENTOS (AUDITORIA)</span></div>
          <div class="audit-grid">
            <div v-for="ev in dayData.events" :key="ev._id" class="audit-card" :class="`audit--${(ev.severity||'info').toLowerCase()}`">
              <div class="audit-header">
                <span class="audit-time">{{ formatTime(ev.timestamp) }}</span>
                <span class="audit-type">{{ typeLbl(ev.type) }}</span>
              </div>
              <div class="audit-body">
                <div class="audit-srv">{{ ev.server_label }} <small>({{ ev.server }})</small></div>
                <div class="audit-msg">{{ ev.details }}</div>
              </div>
              <div class="audit-footer">
                <span class="audit-pill" :class="stateCls(ev.old_status)">{{ ev.old_status || '—' }}</span>
                <span class="audit-arrow">→</span>
                <span class="audit-pill" :class="stateCls(ev.new_status)">{{ ev.new_status || '—' }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { useReportHelpers } from '../../composables/useReportHelpers.js'
const { formatTime, formatTimeOnly, formatDateLong, healthCls, healthLabel, tempCls, cellCls, typeLbl, stateCls } = useReportHelpers()

defineProps({
  historyDays:           { type: Array,        default: () => [] },
  selectedDate:          { type: String,        default: null     },
  loadingDay:            { type: Boolean,       default: false    },
  dayData:               { type: Object,        default: null     },
  hourlyData:            { type: Object,        default: null     },
  loadingHourly:         { type: Boolean,       default: false    },
  historySearch:         { type: String,        default: ''       },
  filteredSnapshots:     { type: Array,         default: () => [] },
  uniqueSnapshotServers: { type: Array,         default: () => [] },
  calendarGrid:          { type: Array,         default: () => [] },
  currentMonth:          { type: Number,        default: 0        },
  currentYear:           { type: Number,        default: 2024     },
  monthNames:            { type: Array,         default: () => [] },
  weekDays:              { type: Array,         default: () => [] },
})
defineEmits(['load-day', 'view-snapshot', 'update:historySearch', 'change-month', 'reset-today'])

function isToday(ds) {
  if (!ds) return false
  const now = new Date()
  const today = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`
  return ds === today
}
</script>

<style scoped>
/* Layout */
.history-layout { display:flex; flex:1; min-height:0; height:calc(100vh - 64px); }
/* Sidebar */
.day-sidebar { width:280px; flex-shrink:0; background:var(--surface); border-right:1px solid var(--border); overflow-y:auto; display:flex; flex-direction:column; padding:20px 16px; gap:20px; }
.calendar-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.cal-nav { background:rgba(0,0,0,0.04); border:1px solid var(--border); border-radius:6px; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--text-2); font-size:16px; font-weight:bold; }
.cal-nav:hover { background:rgba(0,0,0,0.08); color:var(--text); }
.cal-title { font-size:14px; font-weight:700; color:var(--text); cursor:pointer; user-select:none; }
.cal-title:hover { color:var(--blue-400); }
.calendar-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
.cal-weekday { font-size:10px; font-weight:800; color:var(--text-4); text-align:center; padding-bottom:8px; }
.cal-day { aspect-ratio:1; display:flex; flex-direction:column; align-items:center; justify-content:center; border-radius:8px; font-size:12px; font-weight:600; color:var(--text-2); cursor:default; position:relative; transition:all .15s; }
.cal-day.has-data { cursor:pointer; background:rgba(62,146,239,0.08); color:var(--blue-400); border:1px solid rgba(62,146,239,0.2); }
.cal-day.has-data:hover { background:rgba(62,146,239,0.15); }
.cal-day.active { background:var(--blue-400); color:#fff; border-color:var(--blue-400); }
.cal-day.today:not(.active) { border:1.5px solid var(--blue-400); }
.cal-day.off { color:var(--text-4); opacity:.4; }
.cal-num { font-size:11px; line-height:1; }
.cal-dots { display:flex; gap:2px; margin-top:2px; }
.dot-data  { width:4px; height:4px; border-radius:50%; background:var(--blue-400); }
.dot-event { width:4px; height:4px; border-radius:50%; background:var(--amber-600); }
.calendar-legend { display:flex; gap:12px; font-size:10px; color:var(--text-4); }
.leg-item { display:flex; align-items:center; gap:4px; }
.history-search-wrap { margin-top:auto; padding-top:12px; border-top:1px solid var(--border); }
.mini-search { width:100%; padding:7px 10px; border:1px solid var(--border); border-radius:8px; font-size:12px; background:var(--surface); color:var(--text); outline:none; }
.mini-search:focus { border-color:var(--blue-400); }
/* Main */
.day-main { flex:1; overflow-y:auto; padding:28px 32px; display:flex; flex-direction:column; gap:20px; }
.center-placeholder { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; color:var(--text-4); padding:80px 0; font-size:14px; flex:1; }
.center-placeholder svg { opacity:.4; }
.center-loader { text-align:center; color:var(--text-3); padding:60px; display:flex; align-items:center; justify-content:center; gap:10px; font-size:14px; }
.day-main-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
.day-main-title { font-size:20px; font-weight:700; color:var(--text); }
.fleet-status-summary { display:flex; gap:16px; flex-wrap:wrap; }
.fss-item { font-size:12px; color:var(--text-3); }
.fss-item strong { color:var(--text); }
.fss-item.crit strong { color:var(--red-600); }
/* Panel chrome */
.panel { background:var(--grad-surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.panel-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid var(--border); }
.panel-title { font-size:14px; font-weight:600; color:var(--text); }
.panel-badge-count { font-size:11px; font-weight:600; color:var(--text-3); background:rgba(0,0,0,0.05); padding:3px 10px; border-radius:999px; border:1px solid var(--border-light); }
/* Hourly heatmap */
.hourly-grid-wrap { overflow-x:auto; padding:16px; }
.hourly-table { border-collapse:collapse; font-size:11px; }
.hourly-table th { padding:4px 2px; text-align:center; color:var(--text-3); font-size:9px; white-space:nowrap; }
.th-h { min-width:18px; }
.td-srv-name { padding:4px 12px 4px 0; white-space:nowrap; font-size:11px; font-weight:600; color:var(--text-2); min-width:120px; }
.td-h { padding:2px; }
.h-cell { width:16px; height:16px; border-radius:3px; }
.cell--ok    { background:#1a8a7a; opacity:.85; }
.cell--warn  { background:#e67e22; }
.cell--crit  { background:#c0392b; }
.cell--off   { background:var(--gray-200); }
.cell--empty { background:rgba(0,0,0,0.04); }
/* Timeline */
.timeline-controls { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.search-box { display:flex; align-items:center; gap:8px; background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:7px 12px; }
.search-box input { border:none; outline:none; background:transparent; font-size:12px; color:var(--text); width:240px; }
.timeline-stats { font-size:11px; color:var(--text-4); }
/* Table */
.list-panel { background:var(--grad-surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.table-wrap { overflow-x:auto; }
.report-table { width:100%; border-collapse:collapse; font-size:13px; }
.report-table th { text-align:left; padding:11px 16px; border-bottom:1px solid var(--border-light); font-size:10px; color:var(--text-3); text-transform:uppercase; letter-spacing:.06em; white-space:nowrap; }
.report-table td { padding:11px 16px; border-bottom:1px solid rgba(0,0,0,0.05); color:var(--text-2); }
.report-table tbody tr:hover td { background:rgba(0,0,0,0.02); }
.report-table tbody tr:last-child td { border-bottom:none; }
.td-time { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--text-3); white-space:nowrap; }
.td-srv-info { display:flex; flex-direction:column; gap:3px; }
.label-badge { background:rgba(0,0,0,0.05); color:var(--text-2); padding:2px 7px; border-radius:4px; font-size:11px; font-weight:600; }
.host-badge-small { font-family:'JetBrains Mono'; font-size:10px; color:var(--text-4); }
.snap-health-row { display:flex; align-items:center; gap:6px; font-size:12px; }
.health-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.tc-ok   { color:var(--green-600); }
.tc-warn { color:var(--amber-600); }
.tc-crit { color:var(--red-600); }
.tc-off  { color:var(--gray-400); }
.btn-inspect { font-size:11px; font-weight:600; color:var(--blue-400); background:rgba(62,146,239,0.08); border:1px solid rgba(62,146,239,0.2); padding:5px 10px; border-radius:6px; cursor:pointer; transition:all .2s; white-space:nowrap; }
.btn-inspect:hover { background:rgba(62,146,239,0.15); }
/* Audit section */
.audit-section { display:flex; flex-direction:column; gap:16px; }
.section-divider { display:flex; align-items:center; gap:12px; margin:8px 0; }
.section-divider span { font-size:9px; font-weight:800; color:var(--text-4); letter-spacing:.12em; white-space:nowrap; }
.section-divider::before,.section-divider::after { content:''; flex:1; height:1px; background:var(--border); }
.audit-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
.audit-card { border-radius:10px; border:1px solid var(--border); background:var(--surface); padding:14px; display:flex; flex-direction:column; gap:10px; }
.audit--critical { border-color:rgba(224,53,53,0.3); background:rgba(224,53,53,0.04); }
.audit--warning  { border-color:rgba(245,166,35,0.3); background:rgba(245,166,35,0.04); }
.audit-header { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.audit-time { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-4); }
.audit-type { font-size:10px; font-weight:700; color:var(--text-3); background:rgba(0,0,0,0.05); padding:2px 8px; border-radius:4px; }
.audit-srv  { font-size:12px; font-weight:700; color:var(--text); }
.audit-srv small { font-weight:500; color:var(--text-4); font-family:'JetBrains Mono',monospace; font-size:10px; }
.audit-msg  { font-size:11px; color:var(--text-3); margin-top:4px; line-height:1.5; }
.audit-footer { display:flex; align-items:center; gap:8px; }
.audit-pill { font-size:11px; font-weight:600; }
.audit-arrow { color:var(--text-4); }
.empty-log { text-align:center; color:var(--text-4); font-size:13px; display:flex; flex-direction:column; align-items:center; gap:12px; }
.spinner { width:16px; height:16px; border-radius:50%; border:2px solid var(--border); border-top-color:var(--blue-400); animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
