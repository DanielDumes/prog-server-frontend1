<template>
  <header class="topbar">
    <div class="top-loader-bar" v-if="loading"></div>
    <div class="topbar-brand">
      <div class="brand-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="2" y="2" width="20" height="8" rx="2"/>
          <rect x="2" y="14" width="20" height="8" rx="2"/>
          <line x1="6" y1="6" x2="6.01" y2="6" stroke-width="3" stroke-linecap="round"/>
          <line x1="6" y1="18" x2="6.01" y2="18" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </div>
      <div>
        <div class="brand-title">Control Center</div>
        <div class="brand-sub">HPE iLO  · <span class="brand-count">{{ serverCount }} nodos</span></div>
      </div>
    </div>

    <div class="topbar-right">
      <div class="live-pill">
        <span class="live-dot"></span>LIVE
      </div>


      <span class="last-refresh" v-if="lastRefresh">↺ {{ lastRefresh }}</span>

      <button class="btn-icon" @click="$emit('open-reports')" title="Reportes">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        Reportes
      </button>

      <button class="btn-icon" @click="$emit('reload-all')" :disabled="loading">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" :class="{ spin: loading }">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-.09-3.7"/>
        </svg>
        Actualizar
      </button>

      <button class="btn-primary" @click="$emit('add-server')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Servidor
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  serverCount:  { type: Number,  default: 0     },
  loading:      { type: Boolean, default: false  },
  lastRefresh:  { type: String,  default: ''    },
})
defineEmits(['open-reports', 'reload-all', 'add-server'])
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;600&display=swap');

.topbar { background:#faf8f5; border-bottom:1.5px solid #ddd8d0; padding:0 32px; height:60px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; gap:16px; }
.topbar-brand { display:flex; align-items:center; gap:14px; }
.brand-icon { width:38px; height:38px; border-radius:10px; background:#e6f5f2; border:1.5px solid #b8e4dc; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.brand-icon svg { width:18px; height:18px; stroke:#1a8a7a; }
.brand-title { font-size:15px; font-weight:800; color:#1a1714; letter-spacing:-.03em; }
.brand-sub   { font-size:10px; color:#9a9490; margin-top:1px; font-weight:500; }
.brand-count { color:#1a8a7a; font-weight:700; }
.topbar-right { display:flex; align-items:center; gap:8px; }
.live-pill { display:flex; align-items:center; gap:5px; background:#e6f5ee; border:1px solid #b8e4d8; padding:3px 9px; border-radius:20px; font-size:9px; font-weight:800; color:#0f6e44; letter-spacing:.08em; }
.live-dot { width:5px; height:5px; border-radius:50%; background:#1a8a7a; animation:pulse-dot 1.5s infinite; }
@keyframes pulse-dot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:.5} }
.last-refresh { font-size:10px; color:#9a9490; font-family:'IBM Plex Mono',monospace; }
.btn-icon { display:flex; align-items:center; gap:6px; font-family:'Sora',sans-serif; font-size:12px; font-weight:600; padding:7px 13px; border-radius:8px; border:1.5px solid #ddd8d0; background:white; color:#6b6560; cursor:pointer; transition:all .15s; letter-spacing:.02em; }
.btn-icon:hover { background:#f5f2ee; border-color:#b0aba3; color:#1a1714; }
.btn-icon:disabled { opacity:.5; cursor:not-allowed; }
.btn-primary { display:flex; align-items:center; gap:6px; font-family:'Sora',sans-serif; font-size:12px; font-weight:700; padding:7px 15px; border-radius:8px; background:#1a1714; color:#f5f2ee; border:none; cursor:pointer; transition:all .15s; letter-spacing:.02em; }
.btn-primary:hover { background:#2d2925; }
.spin { display:inline-block; animation:spin .8s linear infinite; }
.top-loader-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, #1a8a7a, transparent); background-size: 200% 100%; animation: loader-flow 1.5s infinite linear; z-index: 110; border-radius: 2px 2px 0 0; }
@keyframes loader-flow { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@keyframes spin { to { transform:rotate(360deg); } }
@media (max-width:768px) { .topbar { padding:0 16px; } }
@media (max-width:640px) { .topbar { height:auto; padding:12px 16px; flex-wrap:wrap; } }
</style>
