<template>
  <div v-if="snap" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <header class="modal-header">
        <div class="mh-top">
          <span class="mh-title">Detalle Histórico: {{ snap.server_label }} <span class="mh-ip">({{ snap.server_host }})</span></span>
          <button class="btn-close" @click="$emit('close')">×</button>
        </div>
        <div class="mh-sub">Reporte del {{ formatTime(snap.timestamp) }} (iLO Snapshot)</div>
      </header>
      <div class="modal-body">
        <div class="snap-grid">
          <div class="panel panel--glow">
            <div class="panel-title">Estado en ese momento</div>
            <div class="info-grid">
              <div class="info-row"><span class="info-lbl">Salud</span>   <span :class="healthCls(snap.health)">{{ healthLabel(snap.health) }}</span></div>
              <div class="info-row"><span class="info-lbl">Energía</span> <span :class="snap.power_state === 'On' ? 'tc-ok' : 'tc-off'">{{ snap.power_state }}</span></div>
              <div class="info-row"><span class="info-lbl">Temp Amb</span><span :class="tempCls(snap.max_temp_c)">{{ snap.max_temp_c }}°C</span></div>
              <div class="info-row"><span class="info-lbl">Consumo</span> <span>{{ snap.consumed_watts }}W</span></div>
            </div>
          </div>
          <div class="panel panel--glow">
            <div class="panel-title">Inventario detectado</div>
            <div class="info-grid">
              <div class="info-row"><span class="info-lbl">Modelo</span>  <span class="st-mono">{{ snap.systems_raw?.Model || 'N/A' }}</span></div>
              <div class="info-row"><span class="info-lbl">Serie S/N</span><span class="st-mono">{{ snap.systems_raw?.SerialNumber || '—' }}</span></div>
              <div class="info-row"><span class="info-lbl">CPUs</span>      <span>{{ snap.systems_raw?.ProcessorSummary?.Count ?? '—' }} núcleos</span></div>
              <div class="info-row"><span class="info-lbl">RAM</span>       <span>{{ snap.memory_data?.length ?? 0 }} DIMMs ({{ snap.total_mem_gb }} GB)</span></div>
              <div class="info-row"><span class="info-lbl">Cap. Disco</span><span>{{ snap.total_storage_gb }} GB</span></div>
            </div>
          </div>
        </div>

        <!-- Almacenamiento removido a petición del usuario para simplificar reporte -->

        <div class="panel panel--glow" style="margin-top:20px" v-if="snap.memory_data?.length">
          <div class="panel-title">Mapeo de RAM Histórico</div>
          <div class="table-wrap">
            <table class="report-table">
              <thead><tr><th>DIMM</th><th>Estado</th><th>Velocidad</th><th>Tipo</th></tr></thead>
              <tbody>
                <tr v-for="m in snap.memory_data" :key="m.name">
                  <td>{{ m.name }}</td>
                  <td><span :class="healthCls(m.health)">{{ m.health }}</span></td>
                  <td>{{ m.speed_mhz }} MHz</td>
                  <td>{{ m.type }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useReportHelpers } from '../../composables/useReportHelpers.js'
const { formatTime, healthCls, healthLabel, tempCls } = useReportHelpers()

defineProps({ snap: { type: Object, default: null } })
defineEmits(['close'])
</script>

<style scoped>
.modal-overlay { position:fixed; inset:0; z-index:200; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; padding:20px; }
.modal-content { background:var(--surface); border:1px solid var(--border); border-radius:16px; max-width:760px; width:100%; max-height:90vh; overflow-y:auto; backdrop-filter:blur(20px); }
.modal-header  { padding:20px 24px 16px; border-bottom:1px solid var(--border); }
.mh-top  { display:flex; align-items:center; justify-content:space-between; }
.mh-title{ font-size:16px; font-weight:700; color:var(--text); }
.mh-ip   { font-size:13px; font-weight:500; color:var(--text-4); margin-left:8px; font-family:'IBM Plex Mono', monospace; }
.mh-sub  { font-size:11px; color:var(--text-4); margin-top:6px; }
.btn-close { background:none; border:none; font-size:20px; color:var(--text-3); cursor:pointer; padding:0 4px; }
.btn-close:hover { color:var(--text); }
.modal-body { padding:20px 24px; }
.snap-grid  { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.panel { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px; }
.panel--glow { box-shadow:0 4px 20px rgba(0,0,0,0.08); }
.panel-title { font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; letter-spacing:.08em; margin-bottom:12px; }
.info-grid { display:flex; flex-direction:column; gap:10px; }
.info-row  { display:flex; justify-content:space-between; align-items:center; font-size:13px; }
.info-lbl  { color:var(--text-4); font-weight:500; }
.st-mono   { font-family:'IBM Plex Mono', monospace; font-size:11px; color:var(--text-2); }
.tc-ok   { color:var(--green-600); font-weight:600; }
.tc-warn { color:var(--amber-600); font-weight:600; }
.tc-crit { color:var(--red-600);   font-weight:600; }
.tc-off  { color:var(--gray-400);  font-weight:600; }
.table-wrap { overflow-x:auto; }
.report-table { 
  width:100%; 
  border-collapse:collapse; 
  font-size:12px; 
}
.report-table th { 
  text-align:left; 
  padding:8px 12px; 
  border-bottom:1px solid var(--border-light); 
  font-size:10px; 
  color:var(--text-3); 
  text-transform:uppercase; 
  letter-spacing:.06em; 
}
.report-table td { 
  padding:8px 12px; 
  border-bottom:1px solid rgba(0,0,0,0.04); 
  color:var(--text-2); 
}
.report-table tbody tr:last-child td { 
  border-bottom:none; 
}
</style>
