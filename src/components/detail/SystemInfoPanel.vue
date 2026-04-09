<template>
  <div class="panel">
    <header class="panel-head">
      <div class="ph-mark ph-mark--slate"></div>
      <div class="ph-text">
        <span class="ph-title">Ficha del sistema</span>
        <span class="ph-meta">HPE ProLiant · iLO 5</span>
      </div>
    </header>
    <div class="panel-body">
      <div class="info-table">
        <div class="it-row"><span class="it-lbl">Modelo</span><span class="it-val">{{ data.summary?.model ?? 'N/A' }}</span></div>
        <div class="it-row"><span class="it-lbl">N° de serie</span><span class="it-val mono">{{ data.summary?.serial ?? 'N/A' }}</span></div>
        <div class="it-row"><span class="it-lbl">Versión BIOS</span><span class="it-val mono">{{ data.summary?.bios_version ?? 'N/A' }}</span></div>
        <div class="it-row"><span class="it-lbl">IP iLO</span><span class="it-val mono">{{ server.host }}</span></div>
        <div class="it-row"><span class="it-lbl">Procesadores</span><span class="it-val">{{ data.summary?.cpu_count ?? '—' }} instalados</span></div>
        <div class="it-row"><span class="it-lbl">Memoria total</span><span class="it-val">{{ data.summary?.memory_gib ?? '—' }} GB DDR4</span></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  data:   { type: Object, required: true },
  server: { type: Object, required: true },
})
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
.panel-body { padding:22px; flex:1; display:flex; flex-direction:column; gap:16px; }
/* Info table */
.mono { font-family:'IBM Plex Mono',monospace; }
.info-table { display:flex; flex-direction:column; }
.it-row { display:flex; justify-content:space-between; align-items:center; padding:11px 0; border-bottom:1px solid #ede9e4; gap:12px; }
.it-row:last-child { border-bottom:none; }
.it-lbl { font-size:10px; font-weight:700; color:#9a9490; text-transform:uppercase; letter-spacing:.07em; white-space:nowrap; }
.it-val { font-size:11px; font-weight:600; color:#1a1714; text-align:right; font-family:'IBM Plex Mono',monospace; }
</style>
