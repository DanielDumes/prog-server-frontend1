<template>
  <div class="trends-wrap content">
    <div class="metric-controls">
      <div class="control-group">
        <label>Seleccionar Servidor:</label>
        <select :value="selectedMetricSrv" @change="$emit('update:selectedMetricSrv', $event.target.value || null)">
          <option :value="null">Toda la Flota (Promedio)</option>
          <option v-for="s in srvList" :key="s.id" :value="s.id">{{ s.label }} ({{ s.host }})</option>
        </select>
      </div>
      <div class="control-group">
        <label>Periodo:</label>
        <select :value="metricDays" @change="$emit('update:metricDays', Number($event.target.value)); $emit('fetch-metrics')">
          <option :value="1">Últimas 24h</option>
          <option :value="7">Últimos 7 días</option>
          <option :value="30">Últimos 30 días</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="center-loader" style="padding:100px">
      <div class="spinner"></div> Generando informes de rendimiento…
    </div>

    <div class="metrics-grid" v-else-if="metricPoints.length">
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">🌡 Histórico de Temperatura (01-Inlet Ambient)</div>
          <div class="chart-sub">Promedio de temperatura ambiente detectada por hora</div>
        </div>
        <div class="chart-container">
          <Line :data="tempChartData" :options="chartOptions" />
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">⚡ Histórico de Consumo Eléctrico</div>
          <div class="chart-sub">Consumo promedio en Watts (W) extraído del iLO Power Control</div>
        </div>
        <div class="chart-container">
          <Line :data="powerChartData" :options="chartOptions" />
        </div>
      </div>
    </div>

    <div v-else class="empty-log" style="padding:100px">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
      <p>No hay datos suficientes para generar tendencias en este periodo.</p>
    </div>
  </div>
</template>

<script setup>
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

defineProps({
  loading:          { type: Boolean, default: false  },
  srvList:          { type: Array,   default: () => [] },
  selectedMetricSrv:{ type: [String,null], default: null },
  metricDays:       { type: Number,  default: 7      },
  metricPoints:     { type: Array,   default: () => [] },
  tempChartData:    { type: Object,  required: true  },
  powerChartData:   { type: Object,  required: true  },
  chartOptions:     { type: Object,  required: true  },
})
defineEmits(['update:selectedMetricSrv', 'update:metricDays', 'fetch-metrics'])
</script>

<style scoped>
.trends-wrap { display:flex; flex-direction:column; gap:24px; }
.content { padding:28px 32px; }
.metric-controls { display:flex; gap:24px; flex-wrap:wrap; }
.control-group { display:flex; flex-direction:column; gap:6px; }
.control-group label { font-size:11px; font-weight:600; color:var(--text-3); text-transform:uppercase; letter-spacing:.07em; }
.control-group select { font-size:13px; padding:8px 12px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:var(--text); cursor:pointer; outline:none; }
.center-loader { text-align:center; color:var(--text-3); display:flex; align-items:center; justify-content:center; gap:10px; font-size:14px; }
.metrics-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
.chart-card { background:var(--grad-surface); border-radius:12px; border:1px solid var(--border); padding:24px; }
.chart-header { margin-bottom:16px; }
.chart-title { font-size:14px; font-weight:600; color:var(--text); }
.chart-sub   { font-size:11px; color:var(--text-4); margin-top:4px; }
.chart-container { height:220px; }
.empty-log { text-align:center; color:var(--text-4); font-size:13px; display:flex; flex-direction:column; align-items:center; gap:12px; }
.spinner { width:16px; height:16px; border-radius:50%; border:2px solid var(--border); border-top-color:var(--blue-400); animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
@media (max-width:768px) { .metrics-grid { grid-template-columns:1fr; } }
</style>
