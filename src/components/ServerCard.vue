<template>
  <!-- ── Grid Mode Card ── -->
  <div v-if="!listMode" class="sc" :class="cardCls" @click="$emit('select', server)">
    <!-- Accent top bar -->
    <div class="sc-accent" :class="accentCls"></div>

    <!-- Header -->
    <div class="sc-head">
      <div class="sc-identity">
        <div class="sc-name">{{ server.label }}</div>
        <div class="sc-ip">
          <span class="ip-dot" :class="statusCls"></span>
          {{ server.host }}
        </div>
      </div>
      <HealthPill v-if="data && !loading" :health="data.summary?.health" />
      <div class="sc-loading-pill" v-else-if="loading">
        <div class="spinner-xs"></div>
      </div>
    </div>

    <!-- Model -->
    <div class="sc-model" v-if="data?.summary?.model">{{ data.summary.model }}</div>

    <!-- Loading state -->
    <div class="sc-loader" v-if="loading">
      <div class="spinner"></div>
      <span>Consultando iLO…</span>
    </div>

    <!-- Error state -->
    <div class="sc-error" v-else-if="error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Metrics grid -->
    <div class="sc-metrics" v-else-if="data">
      <div class="met">
        <span class="mv" :class="data.summary?.power_state === 'On' ? 'mv--ok' : 'mv--muted'">
          {{ data.summary?.power_state ?? '—' }}
        </span>
        <span class="ml">Power</span>
      </div>
      <div class="met">
        <span class="mv" :class="tempCls">{{ displayTemp !== null ? displayTemp + '°' : '—' }}</span>
        <span class="ml">Temp Amb</span>
      </div>
      <div class="met">
        <span class="mv mv--blue">
          {{ data.power?.consumed_watts ?? '—' }}<small v-if="data.power?.consumed_watts"> W</small>
        </span>
        <span class="ml">Consumo</span>
      </div>
      <div class="met">
        <span class="mv">
          {{ data.summary?.memory_gib ?? '—' }}<small v-if="data.summary?.memory_gib"> GB</small>
        </span>
        <span class="ml">RAM</span>
      </div>
    </div>

    <!-- Fan strip (quick health at a glance) -->
    <div class="sc-fan-strip" v-if="data?.fans?.length">
      <div
        v-for="f in data.fans" :key="f.name"
        class="fan-dot"
        :class="f.health === 'OK' ? 'fd--ok' : 'fd--warn'"
        :title="`${f.name}: ${f.rpm != null ? f.rpm + ' RPM' : 'N/A'}`"
      ></div>
    </div>

    <!-- Footer -->
    <div class="sc-foot">
      <span class="sc-time">{{ updatedAt ? `↻ ${updatedAt}` : '—' }}</span>
      <div class="sc-actions">
        <button class="btn-delete" @click.stop="handleDelete" title="Eliminar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
        <span class="sc-cta" :class="{ 'sc-cta--disabled': loading || !!error }">Ver detalle →</span>
      </div>
    </div>
  </div>

  <!-- ── List Mode Row ── -->
  <div v-else class="sl" :class="listCls" @click="$emit('select', server)">
    <div class="sl-accent" :class="accentCls"></div>
    <div class="sl-identity">
      <div class="sl-name">{{ server.label }}</div>
      <div class="sl-host">{{ server.host }}</div>
    </div>
    <div class="sl-health">
      <HealthPill v-if="data && !loading" :health="data.summary?.health" />
      <div class="sc-loading-pill" v-else-if="loading"><div class="spinner-xs"></div></div>
    </div>
    <div class="sl-metrics" v-if="data && !error">
      <div class="sl-met"><span class="slm-v" :class="data.summary?.power_state === 'On' ? 'mv--ok' : 'mv--muted'">{{ data.summary?.power_state ?? '—' }}</span><span class="slm-l">Power</span></div>
      <div class="sl-met"><span class="slm-v" :class="tempCls">{{ displayTemp !== null ? displayTemp + '°C' : '—' }}</span><span class="slm-l">Ambiente</span></div>
      <div class="sl-met"><span class="slm-v mv--blue">{{ data.power?.consumed_watts ? data.power.consumed_watts + ' W' : '—' }}</span><span class="slm-l">Watts</span></div>
      <div class="sl-met"><span class="slm-v">{{ data.summary?.memory_gib ? data.summary.memory_gib + ' GB' : '—' }}</span><span class="slm-l">RAM</span></div>
      <div class="sl-met"><span class="slm-v">{{ data.summary?.cpu_count ?? '—' }}</span><span class="slm-l">CPUs</span></div>
    </div>
    <div class="sl-error" v-else-if="error">{{ error }}</div>
    <div class="sl-loader" v-else-if="loading"><div class="spinner-xs"></div> Cargando…</div>
    <div class="sl-right">
      <button class="btn-delete" @click.stop="handleDelete" title="Eliminar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
        </svg>
      </button>
      <span class="sc-cta">→</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Swal from 'sweetalert2'
import HealthPill from './HealthPill.vue'
import { useIlo } from '../composables/useIlo.js'
import { REFRESH_INTERVAL_SEC } from '../config/servers.js'

const props = defineProps({ server: Object, listMode: { type: Boolean, default: false } })
const emit  = defineEmits(['select', 'status', 'deleted'])

const { fetchSummary, deleteServer } = useIlo()
const data      = ref(null)
const loading   = ref(true)
const error     = ref(null)
const updatedAt = ref('')
const deleting      = ref(false)
let timer = null

// ── Computed ─────────────────────────────────────────────────────
const displayTemp = computed(() => {
  const sensors = data.value?.temperatures ?? []
  if (!sensors.length) return null
  
  // Priorizar el sensor "Inlet Ambient" (primer sensor en iLO 5 usualmente)
  const ambient = sensors.find(s => {
    const n = (s.name || "").toLowerCase()
    return n.includes("inlet") || n.includes("ambient")
  })
  
  if (ambient && ambient.reading_c != null) return ambient.reading_c
  
  // Fallback: Max temp de todos los sensores
  const vals = sensors.map(t => t.reading_c).filter(v => v != null)
  return vals.length ? Math.max(...vals) : null
})

const statusCls = computed(() => {
  if (error.value) return 'ip--unknown'
  const h = (data.value?.summary?.health ?? '').toLowerCase()
  if (h === 'ok')       return 'ip--ok'
  if (h === 'warning')  return 'ip--warn'
  if (h === 'critical') return 'ip--crit'
  if (data.value?.summary?.power_state === 'Off') return 'ip--off'
  return 'ip--unknown'
})

const _status = computed(() => {
  if (error.value) return 'unknown'
  const h = (data.value?.summary?.health ?? '').toLowerCase()
  if (h === 'ok')       return 'ok'
  if (h === 'warning')  return 'warn'
  if (h === 'critical') return 'crit'
  if (data.value?.summary?.power_state === 'Off') return 'off'
  return 'unknown'
})

const accentCls = computed(() => ({
  'ac--ok':      _status.value === 'ok',
  'ac--warn':    _status.value === 'warn',
  'ac--crit':    _status.value === 'crit',
  'ac--off':     _status.value === 'off',
  'ac--unknown': _status.value === 'unknown',
}))

const cardCls = computed(() => ({
  'sc--warn': _status.value === 'warn',
  'sc--crit': _status.value === 'crit',
}))

const listCls = computed(() => ({
  'sl--warn': _status.value === 'warn',
  'sl--crit': _status.value === 'crit',
}))

const tempCls = computed(() => {
  if (displayTemp.value === null) return ''
  if (displayTemp.value > 80) return 'mv--crit'
  if (displayTemp.value > 65) return 'mv--warn'
  return ''
})

// ── Methods ──────────────────────────────────────────────────────
async function load() {
  loading.value = true; error.value = null
  try {
    data.value      = await fetchSummary(props.server)
    updatedAt.value = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
    emit('status', _status.value)
  } catch(e) {
    error.value = e.message
    emit('status', 'unknown')
  } finally {
    loading.value = false
  }
}

async function handleDelete() {
  const result = await Swal.fire({
    title: '¿Eliminar servidor?',
    html: `Estas a punto de eliminar <b>${props.server.label}</b>.<br><small style="color:var(--text-4)">Esta acción no se puede deshacer.</small>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#94A3B8',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    background: '#FAFAFB',
    color: '#0F172A',
    iconColor: '#EF4444',
    heightAuto: false,
    customClass: {
      popup: 'swal-premium-popup',
      title: 'swal-premium-title',
      confirmButton: 'swal-premium-confirm',
      cancelButton: 'swal-premium-cancel'
    }
  })

  if (result.isConfirmed) {
    deleting.value = true
    try {
      await deleteServer(props.server.id)
      emit('deleted', props.server.id)
      
      Swal.fire({
        title: 'Eliminado',
        text: 'El servidor ha sido removido con éxito.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        heightAuto: false
      })
    } catch (e) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar el servidor: ' + e.message,
        icon: 'error',
        heightAuto: false
      })
    } finally {
      deleting.value = false
    }
  }
}

onMounted(() => { load(); timer = setInterval(load, REFRESH_INTERVAL_SEC * 1000) })
onUnmounted(() => clearInterval(timer))
defineExpose({ reload: load })
</script>

<style scoped>
/* ══════════════════════════════════════
   GRID CARD
══════════════════════════════════════ */
.sc {
  background: var(--grad-surface); border-radius: 14px;
  border: 1px solid var(--border); overflow: hidden; cursor: pointer;
  display: flex; flex-direction: column;
  transition: transform .25s cubic-bezier(0.16,1,0.3,1), box-shadow .25s, border-color .25s;
  position: relative;
}
.sc::after {
  content: ''; position: absolute; inset: 0; pointer-events: none; border-radius: 14px;
  background: radial-gradient(circle at top right, rgba(255,255,255,0.5), transparent 60%);
}
.sc:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); border-color: rgba(0,0,0,0.12); }
.sc--warn         { border-color: rgba(245,166,35,0.25); }
.sc--warn:hover   { border-color: rgba(245,166,35,0.5);  box-shadow: 0 20px 40px rgba(245,166,35,0.12); }
.sc--crit         { border-color: rgba(224,53,53,0.3); }
.sc--crit:hover   { border-color: rgba(224,53,53,0.6);   box-shadow: 0 20px 40px rgba(224,53,53,0.18); }

/* Accent bar */
.sc-accent { height: 3px; width: 100%; flex-shrink: 0; transition: height .2s; }
.sc:hover .sc-accent { height: 4px; }
.ac--ok      { background: linear-gradient(90deg, var(--green-600), rgba(46,178,83,0.3)); }
.ac--warn    { background: linear-gradient(90deg, var(--amber-600), rgba(245,166,35,0.3)); }
.ac--crit    { background: linear-gradient(90deg, var(--red-600),   rgba(224,53,53,0.3));  box-shadow: 0 0 12px rgba(224,53,53,0.5); }
.ac--off     { background: var(--gray-400); }
.ac--unknown { background: var(--border); }

/* Head */
.sc-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 16px 16px 8px; }
.sc-identity { flex: 1; min-width: 0; }
.sc-name { font-size: 16px; font-weight: 700; color: var(--text); letter-spacing: 0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sc-ip   { display: flex; align-items: center; gap: 6px; font-size: 11px; font-family: 'JetBrains Mono'; color: var(--text-3); margin-top: 4px; }
.ip-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.ip--ok      { background: var(--green-600); box-shadow: 0 0 6px var(--green-600); }
.ip--warn    { background: var(--amber-600); box-shadow: 0 0 6px var(--amber-600); }
.ip--crit    { background: var(--red-600);   box-shadow: 0 0 8px var(--red-600); animation: pulse 1.5s ease infinite; }
.ip--off     { background: var(--gray-400); }
.ip--unknown { background: var(--gray-400); }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

.sc-loading-pill { display: flex; align-items: center; }
.spinner-xs { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--border); border-top-color: var(--blue-400); animation: spin .8s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }

.sc-model { font-size: 10px; color: var(--text-4); font-family: 'JetBrains Mono'; padding: 0 16px 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Loader / Error */
.sc-loader { display: flex; align-items: center; gap: 10px; padding: 20px 16px; font-size: 13px; color: var(--text-3); flex: 1; }
.sc-error  {
  display: flex; align-items: flex-start; gap: 8px; margin: 0 16px 14px;
  padding: 10px 12px; background: rgba(224,53,53,0.08); border-radius: 8px;
  font-size: 12px; color: var(--red-600); flex: 1; border: 1px solid rgba(224,53,53,0.2); line-height: 1.4;
}
.sc-error span { overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

/* Metrics */
.sc-metrics {
  display: grid; grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid var(--border-light); border-bottom: 1px solid var(--border-light);
  background: rgba(0,0,0,0.02);
}
.met { padding: 12px 0; text-align: center; border-right: 1px solid var(--border-light); }
.met:last-child { border-right: none; }
.mv { display: block; font-size: 14px; font-weight: 700; color: var(--text); line-height: 1.2; }
.mv small  { font-size: 9px; font-weight: 500; color: var(--text-4); margin-left: 1px; }
.mv--ok    { color: var(--green-600); }
.mv--warn  { color: var(--amber-600); }
.mv--crit  { color: var(--red-600); }
.mv--blue  { color: var(--blue-400); }
.mv--muted { color: var(--text-4); }
.ml { display: block; font-size: 9px; font-weight: 600; color: var(--text-4); margin-top: 3px; text-transform: uppercase; letter-spacing: .06em; }

/* Fan strip */
.sc-fan-strip { display: flex; gap: 4px; padding: 8px 16px 4px; flex-wrap: wrap; }
.fan-dot { width: 7px; height: 7px; border-radius: 50%; }
.fd--ok   { background: var(--green-600); opacity: .7; }
.fd--warn { background: var(--amber-600); box-shadow: 0 0 4px var(--amber-600); }

/* Footer */
.sc-foot { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; margin-top: auto; }
.sc-time  { font-size: 10px; color: var(--text-4); font-family: 'JetBrains Mono'; }
.sc-actions { display: flex; align-items: center; gap: 10px; }
.sc-cta   { font-size: 12px; font-weight: 600; color: var(--blue-400); transition: all .2s; }
.sc-cta--disabled { color: var(--text-4); }
.sc:hover .sc-cta:not(.sc-cta--disabled) { color: var(--blue-600); }

.btn-delete {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px;
  border: 1px solid transparent; background: rgba(0,0,0,0.03);
  cursor: pointer; transition: all .2s;
}
.btn-delete:hover { background: rgba(224,53,53,0.12); border-color: rgba(224,53,53,0.3); }
.btn-delete:hover svg { stroke: var(--red-600); }
.btn-delete svg { stroke: var(--text-4); transition: stroke .2s; }

/* Delete confirm styles removed as we now use SweetAlert2 */

/* ══════════════════════════════════════
   LIST ROW
══════════════════════════════════════ */
.sl {
  display: flex; align-items: center; gap: 16px; padding: 14px 18px;
  background: var(--grad-surface); border: 1px solid var(--border); border-radius: 10px;
  cursor: pointer; position: relative; overflow: hidden;
  transition: background .2s, border-color .2s, transform .2s;
}
.sl:hover { background: rgba(255,255,255,0.95); border-color: rgba(0,0,0,0.15); box-shadow: 0 4px 12px rgba(0,0,0,0.04); transform: translateX(3px); }
.sl--warn       { border-color: rgba(245,166,35,0.2); }
.sl--warn:hover { border-color: rgba(245,166,35,0.4); }
.sl--crit       { border-color: rgba(224,53,53,0.25); }
.sl--crit:hover { border-color: rgba(224,53,53,0.5); }

.sl-accent { width: 3px; height: 100%; position: absolute; left: 0; top: 0; }
.sl-identity { display: flex; flex-direction: column; gap: 3px; min-width: 130px; }
.sl-name { font-size: 14px; font-weight: 700; color: var(--text); }
.sl-host { font-size: 11px; font-family: 'JetBrains Mono'; color: var(--text-3); }
.sl-health { width: 90px; flex-shrink: 0; }
.sl-metrics { display: flex; gap: 20px; flex: 1; }
.sl-met { display: flex; flex-direction: column; gap: 2px; }
.slm-v { font-size: 13px; font-weight: 700; color: var(--text); }
.slm-l { font-size: 9px; font-weight: 600; color: var(--text-4); text-transform: uppercase; letter-spacing: .06em; }
.sl-error { font-size: 11px; color: var(--red-600); flex: 1; }
.sl-loader { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-3); flex: 1; }
.sl-right { margin-left: auto; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
</style>

<style>
/* Global overrides for SweetAlert2 to match the theme */
.swal-premium-popup {
  border-radius: 16px !important;
  font-family: 'Sora', 'Outfit', sans-serif !important;
  padding: 1.5rem !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15) !important;
}
.swal-premium-title {
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  color: var(--text) !important;
}
.swal-premium-confirm, .swal-premium-cancel {
  border-radius: 8px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  font-size: 13px !important;
  padding: 10px 24px !important;
}
.swal-premium-confirm {
  background: var(--red-600) !important;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2) !important;
}
.swal-premium-cancel {
  background: var(--gray-400) !important;
}
</style>