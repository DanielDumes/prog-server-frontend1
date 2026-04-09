<template>
  <div class="panel">
    <header class="panel-head">
      <div class="ph-mark ph-mark--coral"></div>
      <div class="ph-text">
        <span class="ph-title">Memoria RAM</span>
        <span class="ph-meta">{{ data.summary?.memory_gib ?? '?' }} GB · {{ data.memory?.dimms?.length ?? 0 }} módulos</span>
      </div>
    </header>

    <div class="panel-body">
      <div class="dimm-grid">
        <div class="dimm-card" v-for="d in data.memory?.dimms" :key="d.name" :class="'dc--' + dimmCls(d.health)">
          <div class="dc-accent"></div>
          <div class="dc-inner">
            <div class="dc-slot">{{ d.name }}</div>
            <div class="dc-size">{{ dimmGb(d) }}<span class="dc-unit"> GB</span></div>
            <div class="dc-info">{{ d.speed_mhz }} MHz · {{ d.type }}</div>
            <div class="dc-badge" :class="'dcb--' + dimmCls(d.health)">{{ d.health }}</div>
          </div>
        </div>
      </div>
    </div>

    <footer class="panel-foot">
      <span class="pf-label">Velocidad</span>
      <span class="pf-val">{{ data.memory?.dimms?.[0]?.speed_mhz ?? '—' }} MHz</span>
      <span class="pf-sep">·</span>
      <span class="pf-label">Tipo</span>
      <span class="pf-val">{{ data.memory?.dimms?.[0]?.type ?? 'DDR4' }}</span>
    </footer>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, required: true } })

function dimmCls(h)  { return { OK: 'ok', Warning: 'warn', Critical: 'crit' }[h] ?? 'ok' }
function dimmGb(d)   { const mb = d.size_mb ?? d.capacity_mib ?? d.size ?? 0; return mb ? Math.round(mb / 1024) : '?' }
</script>

<style scoped>
/* Panel chrome */
.panel { background:white; border:1.5px solid #ddd8d0; border-radius:18px; display:flex; flex-direction:column; overflow:hidden; transition:transform .18s,box-shadow .18s; }
.panel:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(26,23,20,.07); }
.panel-head { padding:18px 22px; display:flex; align-items:center; gap:12px; border-bottom:1px solid #ede9e4; background:#faf8f5; }
.ph-mark { width:3px; height:28px; border-radius:2px; flex-shrink:0; }
.ph-mark--coral { background:#c0582b; }
.ph-text { flex:1; }
.ph-title { display:block; font-size:12px; font-weight:800; color:#1a1714; text-transform:uppercase; letter-spacing:.07em; }
.ph-meta  { display:block; font-size:10px; font-weight:500; color:#9a9490; margin-top:2px; text-transform:uppercase; letter-spacing:.05em; }
.panel-body { padding:22px; flex:1; display:flex; flex-direction:column; gap:16px; }
.panel-foot { padding:12px 22px; border-top:1px solid #ede9e4; background:#faf8f5; display:flex; align-items:center; gap:10px; font-size:10px; font-weight:600; }
.pf-label { color:#9a9490; text-transform:uppercase; letter-spacing:.08em; }
.pf-val   { color:#1a1714; font-family:'IBM Plex Mono',monospace; font-size:11px; }
.pf-sep   { color:#d4cfc8; }
/* DIMM grid */
.dimm-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.dimm-card { border-radius:12px; border:1.5px solid #ddd8d0; overflow:hidden; display:flex; transition:all .15s; }
.dimm-card:hover { border-color:#b8e4dc; }
.dc-accent { width:4px; flex-shrink:0; }
.dc--ok   .dc-accent { background:#1a8a7a; }
.dc--warn .dc-accent { background:#e67e22; }
.dc--crit .dc-accent { background:#c0392b; }
.dc-inner { flex:1; padding:10px 12px; }
.dc-slot  { font-size:9px; font-weight:700; color:#9a9490; text-transform:uppercase; letter-spacing:.06em; margin-bottom:4px; }
.dc-size  { font-size:20px; font-weight:800; color:#1a1714; line-height:1; letter-spacing:-.02em; }
.dc-unit  { font-size:11px; font-weight:600; color:#6b6560; }
.dc-info  { font-size:9px; color:#9a9490; font-weight:500; margin-top:4px; }
.dc-badge { display:inline-block; font-size:9px; font-weight:700; margin-top:6px; padding:2px 7px; border-radius:5px; }
.dcb--ok   { background:#e6f5f2; color:#0f6e44; }
.dcb--warn { background:#fef3e6; color:#854f0b; }
.dcb--crit { background:#fdecea; color:#a32d2d; }
</style>
