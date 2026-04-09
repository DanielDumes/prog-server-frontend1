<template>
  <div class="panel" v-if="hasStorage">
    <header class="panel-head">
      <div class="ph-mark ph-mark--slate"></div>
      <div class="ph-text">
        <span class="ph-title">Almacenamiento</span>
        <span class="ph-meta">Inventario por Arreglos de Discos</span>
      </div>
    </header>
    <div class="panel-body">
      <div v-for="(ctrl, idx) in storageControllers" :key="idx" class="ctrl-block">
        <div class="ctrl-label">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>
          {{ ctrl.name }}
        </div>
        
        <div class="groups-container">
          <div v-for="group in ctrl.groups" :key="group.name" class="group-section">
            <div class="group-header">
              <div class="group-info">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="group-icon">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                </svg>
                <span class="group-name">{{ group.name }}</span>
              </div>
              <span class="group-badge" :class="group.health === 'OK' ? 'badge--ok' : 'badge--warn'">
                {{ group.health }}
              </span>
            </div>
            
            <div class="drive-list">
              <div class="drive-row" v-for="d in group.drives" :key="d.id || d.name">
                <span class="drive-type" :class="d.type?.includes('SSD') ? 'dtype--ssd' : 'dtype--hdd'">
                  {{ d.type?.includes('SSD') ? 'SSD' : (d.type?.includes('HDD') ? 'HDD' : 'DRV') }}
                </span>
                <div class="drive-meta">
                  <span class="drive-name">{{ d.name }}</span>
                  <div class="drive-sub">
                    <span class="drive-model">{{ d.model }}</span>
                    <span class="drive-slot" v-if="d.slot">| {{ d.slot }}</span>
                  </div>
                </div>
                <span class="drive-cap">{{ d.capacity_gb }} GB</span>
                <span class="drive-health" :class="d.health === 'OK' ? 'st--ok' : 'st--warn'">{{ d.health }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ data: { type: Object, required: true } })

const storageControllers = computed(() => {
  return (props.data.storage?.controllers ?? []).filter(c => c.groups?.length)
})

const hasStorage = computed(() => storageControllers.value.length > 0)
</script>

<style scoped>
/* Panel chrome */
.panel { background:white; border:1.5px solid #ddd8d0; border-radius:18px; display:flex; flex-direction:column; overflow:hidden; transition:transform .18s,box-shadow .18s; }
.panel:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(26,23,20,.07); }
.panel-head { padding:18px 22px; display:flex; align-items:center; gap:12px; border-bottom:1px solid #ede9e4; background:#faf8f5; }
.ph-mark { width:3px; height:28px; border-radius:2px; flex-shrink:0; }
.ph-mark--slate { background:#6b6560; }
.ph-text { flex:1; }
.ph-title { display:block; font-size:12px; font-weight:800; color:#1a1714; text-transform:uppercase; letter-spacing:.07em; }
.ph-meta  { display:block; font-size:10px; font-weight:500; color:#9a9490; margin-top:2px; text-transform:uppercase; letter-spacing:.05em; }
.panel-body { padding:22px; flex:1; display:flex; flex-direction:column; gap:24px; }

/* Controllers */
.ctrl-label { display:flex; align-items:center; gap:5px; font-size:9px; font-weight:800; color:#9a9490; text-transform:uppercase; letter-spacing:.07em; padding-bottom:8px; border-bottom:1px dashed #ddd8d0; margin-bottom:12px; }

/* Groups (Arrays) */
.groups-container { display:flex; flex-direction:column; gap:20px; }
.group-section { display:flex; flex-direction:column; gap:10px; }
.group-header { display:flex; align-items:center; justify-content:space-between; padding:0 4px; }
.group-info { display:flex; align-items:center; gap:8px; }
.group-icon { color:#6b6560; opacity:0.6; }
.group-name { font-size:11px; font-weight:700; color:#4a4540; text-transform:uppercase; letter-spacing:.02em; }
.group-badge { font-size:8px; font-weight:800; padding:2px 6px; border-radius:4px; text-transform:uppercase; }
.badge--ok { background:#f0f7f4; color:#2d6a4f; border:1px solid #d8e9e1; }
.badge--warn { background:#fff8f1; color:#a35200; border:1px solid #ffecd9; }

/* Drive rows */
.drive-list { display:flex; flex-direction:column; gap:6px; padding-left:12px; border-left:2px solid #f0eeeb; margin-left:8px; }
.drive-row  { display:flex; align-items:center; gap:12px; padding:10px 14px; background:#f5f2ee; border-radius:10px; border:1px solid #ddd8d0; transition:all .15s; }
.drive-row:hover { border-color:#b8e4dc; background:white; transform:translateX(4px); }

.drive-type  { font-size:8px; font-weight:800; padding:3px 7px; border-radius:5px; flex-shrink:0; width:34px; text-align:center; }
.dtype--ssd  { background:#e6f0fb; color:#185fa5; }
.dtype--hdd  { background:#faf8f5; color:#6b6560; border:1px solid #ddd8d0; }

.drive-meta  { flex:1; min-width:0; }
.drive-name  { font-family:'IBM Plex Mono',monospace; font-size:11px; font-weight:600; color:#1a1714; display:block; }
.drive-sub   { display:flex; align-items:center; gap:6px; margin-top:2px; }
.drive-model { font-size:9px; color:#9a9490; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.drive-slot  { font-size:9px; color:#1a8a7a; font-weight:500; white-space:nowrap; }

.drive-cap   { font-family:'IBM Plex Mono',monospace; font-size:12px; font-weight:600; color:#1a1714; white-space:nowrap; }
.drive-health { font-size:9px; font-weight:700; padding:3px 8px; border-radius:5px; white-space:nowrap; min-width:45px; text-align:center; }
.st--ok   { background:#e6f5f2; color:#0f6e44; }
.st--warn { background:#fef3e6; color:#854f0b; }
</style>
