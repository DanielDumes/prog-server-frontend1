<template>
  <div>
    <div class="content" v-if="loading">
      <div class="center-loader"><div class="spinner"></div> Recuperando eventos de los últimos 7 días…</div>
    </div>
    <div class="content" v-else-if="error">
      <div class="alert-bar">{{ error }}</div>
    </div>

    <div class="content" v-else>
      <!-- KPI Cards -->
      <div class="stat-row">
        <div class="stat-card">
          <div class="stat-icon icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-lbl">Total Incidencias</div>
            <div class="stat-val">{{ weekly.metrics?.total_events ?? 0 }}</div>
            <div class="stat-sub">Registros de los últimos 7 días</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon icon--amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-lbl">Cambios de Energía</div>
            <div class="stat-val warn">{{ weekly.metrics?.power_events ?? 0 }}</div>
            <div class="stat-sub">Encendidos y apagados detectados</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon icon--red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-lbl">Alertas Críticas</div>
            <div class="stat-val crit">{{ weekly.metrics?.critical_alarms ?? 0 }}</div>
            <div class="stat-sub">Sensores o componentes fallando</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon icon--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-lbl">Recuperaciones</div>
            <div class="stat-val ok">{{ weekly.metrics?.recoveries ?? 0 }}</div>
            <div class="stat-sub">Sistemas que volvieron a estado Óptimo</div>
          </div>
        </div>
      </div>

      <!-- Event Log -->
      <div class="panel list-panel">
        <div class="panel-header">
          <div class="panel-title">Registro de Eventos — Últimos 7 días</div>
          <div class="panel-badge-count">{{ filteredWeeklyLogs.length ?? 0 }} registros</div>
        </div>
        <div v-if="!filteredWeeklyLogs.length" class="empty-log">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><path d="M9 14 4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
          <span>Sin incidencias esta semana. Todo en orden.</span>
        </div>
        <div class="table-wrap" v-else>
          <table class="report-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th><th>Servidor</th><th>IP</th>
                <th>Tipo Evento</th><th>Cambio de Estado</th><th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in filteredWeeklyLogs" :key="log._id">
                <td class="td-time">{{ formatTime(log.timestamp) }}</td>
                <td><span class="label-badge">{{ log.server_label || '—' }}</span></td>
                <td><span class="host-badge">{{ log.server }}</span></td>
                <td><span class="chip" :class="typeCls(log.type)">{{ typeLbl(log.type) }}</span></td>
                <td>
                  <span class="state-pill" :class="stateCls(log.old_status)">{{ log.old_status || '—' }}</span>
                  <span class="arrow">→</span>
                  <span class="state-pill" :class="stateCls(log.new_status)">{{ log.new_status || '—' }}</span>
                </td>
                <td class="td-details">{{ log.details }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useReportHelpers } from '../../composables/useReportHelpers.js'
const { formatTime, typeCls, typeLbl, stateCls } = useReportHelpers()

defineProps({
  loading:             { type: Boolean, default: false  },
  error:               { type: String,  default: null   },
  weekly:              { type: Object,  default: () => ({}) },
  filteredWeeklyLogs:  { type: Array,   default: () => [] },
})
</script>

<style scoped>
.content { padding:28px 32px; display:flex; flex-direction:column; gap:24px; }
.center-loader { text-align:center; color:var(--text-3); padding:60px; display:flex; align-items:center; justify-content:center; gap:10px; font-size:14px; }
.alert-bar { background:var(--red-50); color:var(--red-600); padding:12px 16px; border-radius:8px; border:1px solid rgba(224,53,53,0.3); font-size:13px; }
/* KPI */
.stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
.stat-card { background:var(--grad-surface); border-radius:12px; border:1px solid var(--border); padding:20px 18px; box-shadow:0 4px 20px rgba(0,0,0,0.15); display:flex; align-items:center; gap:14px; }
.stat-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.stat-icon svg { width:20px; height:20px; }
.icon--blue  { background:rgba(62,146,239,0.15);  color:var(--blue-400);  border:1px solid rgba(62,146,239,0.3);  box-shadow:0 0 14px rgba(62,146,239,0.15); }
.icon--amber { background:rgba(245,166,35,0.15);  color:var(--amber-600); border:1px solid rgba(245,166,35,0.3);  box-shadow:0 0 14px rgba(245,166,35,0.15); }
.icon--red   { background:rgba(224,53,53,0.15);   color:var(--red-600);   border:1px solid rgba(224,53,53,0.3);   box-shadow:0 0 14px rgba(224,53,53,0.15); }
.icon--green { background:rgba(46,178,83,0.15);   color:var(--green-600); border:1px solid rgba(46,178,83,0.3);  box-shadow:0 0 14px rgba(46,178,83,0.15); }
.stat-body { display:flex; flex-direction:column; }
.stat-lbl { font-size:10px; color:var(--text-3); text-transform:uppercase; letter-spacing:.1em; font-weight:600; }
.stat-val { font-size:30px; font-weight:700; color:var(--text); margin-top:4px; line-height:1; }
.stat-val.ok   { color:var(--green-600); }
.stat-val.warn { color:var(--amber-600); }
.stat-val.crit { color:var(--red-600); }
.stat-sub { font-size:11px; color:var(--text-4); margin-top:5px; }
/* Panel / Table */
.list-panel { background:var(--grad-surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.panel-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid var(--border); }
.panel-title { font-size:14px; font-weight:600; color:var(--text); }
.panel-badge-count { font-size:11px; font-weight:600; color:var(--text-3); background:rgba(0,0,0,0.05); padding:3px 10px; border-radius:999px; border:1px solid var(--border-light); }
.table-wrap { overflow-x:auto; }
.report-table { width:100%; border-collapse:collapse; font-size:13px; }
.report-table th { text-align:left; padding:11px 16px; border-bottom:1px solid var(--border-light); font-size:10px; color:var(--text-3); text-transform:uppercase; letter-spacing:.06em; white-space:nowrap; }
.report-table td { padding:11px 16px; border-bottom:1px solid rgba(0,0,0,0.05); color:var(--text-2); }
.report-table tbody tr:hover td { background:rgba(0,0,0,0.02); }
.report-table tbody tr:last-child td { border-bottom:none; }
.td-time    { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--text-3); white-space:nowrap; }
.td-details { font-size:11px; color:var(--text-3); max-width:280px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.host-badge  { font-family:'JetBrains Mono'; background:rgba(62,146,239,0.1); color:var(--blue-400); padding:3px 8px; border-radius:4px; border:1px solid rgba(62,146,239,0.2); font-size:11px; }
.label-badge { background:rgba(0,0,0,0.05); color:var(--text-2); padding:3px 8px; border-radius:4px; font-size:11px; font-weight:600; border:1px solid var(--border-light); }
.chip       { font-size:10px; font-weight:600; padding:3px 10px; border-radius:999px; display:inline-block; border:1px solid; }
.chip--ok   { background:rgba(46,178,83,0.1);  color:var(--green-600); border-color:rgba(46,178,83,0.3);  }
.chip--warn { background:rgba(245,166,35,0.1); color:var(--amber-600); border-color:rgba(245,166,35,0.3); }
.chip--crit { background:rgba(224,53,53,0.1);  color:var(--red-600);   border-color:rgba(224,53,53,0.3);  }
.chip--off  { background:rgba(148,163,184,0.1);color:var(--gray-400);  border-color:rgba(148,163,184,0.2);}
.state-pill { font-size:11px; font-weight:600; }
.arrow      { color:var(--text-4); margin:0 6px; }
.tc-ok   { color:var(--green-600); }
.tc-warn { color:var(--amber-600); }
.tc-crit { color:var(--red-600); }
.tc-off  { color:var(--gray-400); }
.empty-log { padding:40px; text-align:center; color:var(--text-4); font-size:13px; display:flex; flex-direction:column; align-items:center; gap:12px; }
.spinner { width:16px; height:16px; border-radius:50%; border:2px solid var(--border); border-top-color:var(--blue-400); animation:spin .8s linear infinite; flex-shrink:0; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
