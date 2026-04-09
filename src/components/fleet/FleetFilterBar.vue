<template>
  <div class="filter-bar">
    <!-- Search -->
    <div class="search-wrap">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input :value="searchQ" @input="$emit('update:searchQ', $event.target.value)" class="search-input" placeholder="Buscar por nombre o IP…" />
      <button class="search-clear" v-if="searchQ" @click="$emit('update:searchQ', '')">×</button>
    </div>

    <!-- Status chips -->
    <div class="filter-chips">
      <button
        v-for="f in filters" :key="f.key"
        class="fchip" :class="{ active: activeFilter === f.key, [`fchip--${f.cls}`]: activeFilter === f.key }"
        @click="$emit('update:activeFilter', activeFilter === f.key ? 'all' : f.key)"
      >
        <span class="fchip-dot" :class="`fd--${f.cls}`"></span>
        {{ f.label }}
        <span class="fchip-count">{{ f.count }}</span>
      </button>
    </div>

    <!-- Sort -->
    <div class="sort-wrap">
      <select :value="sortBy" @change="$emit('update:sortBy', $event.target.value)" class="sort-select">
        <option value="name">Nombre A–Z</option>
        <option value="status">Estado</option>
      </select>
    </div>

    <!-- Grid/List toggle -->
    <div class="grid-toggle">
      <button class="gt-btn" :class="{ active: gridMode === 'grid' }" @click="$emit('update:gridMode', 'grid')" title="Cuadrícula">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
      </button>
      <button class="gt-btn" :class="{ active: gridMode === 'list' }" @click="$emit('update:gridMode', 'list')" title="Lista">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <circle cx="3" cy="6" r="1" fill="currentColor"/>
          <circle cx="3" cy="12" r="1" fill="currentColor"/>
          <circle cx="3" cy="18" r="1" fill="currentColor"/>
        </svg>
      </button>
    </div>

    <span class="result-count" v-if="searchQ || activeFilter !== 'all'">
      {{ resultCount }} de {{ total }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  filters:      { type: Array,  default: () => [] },
  activeFilter: { type: String, default: 'all'    },
  sortBy:       { type: String, default: 'name'   },
  gridMode:     { type: String, default: 'grid'   },
  searchQ:      { type: String, default: ''       },
  resultCount:  { type: Number, default: 0        },
  total:        { type: Number, default: 0        },
})
defineEmits(['update:searchQ', 'update:activeFilter', 'update:sortBy', 'update:gridMode'])
</script>

<style scoped>
.filter-bar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:12px 32px; border-bottom:1px solid #e8e4df; background:#faf8f5; }
.search-wrap  { position:relative; }
.search-icon  { position:absolute; left:10px; top:50%; transform:translateY(-50%); pointer-events:none; color:#9a9490; }
.search-input { background:white; border:1.5px solid #ddd8d0; border-radius:8px; padding:7px 32px; font-size:12px; font-family:'Sora',sans-serif; color:#1a1714; outline:none; width:210px; transition:border-color .2s,width .25s; }
.search-input::placeholder { color:#b0aba3; }
.search-input:focus { border-color:#1a8a7a; width:260px; }
.search-clear { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:#9a9490; cursor:pointer; font-size:16px; line-height:1; padding:0; }
.search-clear:hover { color:#1a1714; }
.filter-chips { display:flex; gap:5px; }
.fchip { display:flex; align-items:center; gap:6px; padding:5px 11px; border-radius:20px; font-size:11px; font-weight:600; background:white; border:1.5px solid #ddd8d0; color:#6b6560; cursor:pointer; transition:all .15s; font-family:'Sora',sans-serif; }
.fchip:hover { border-color:#b0aba3; color:#1a1714; }
.fchip.fchip--green { background:#e6f5f2; border-color:#b8e4dc; color:#0f6e44; }
.fchip.fchip--amber { background:#fef3e6; border-color:#f9d5a5; color:#854f0b; }
.fchip.fchip--red   { background:#fdecea; border-color:#f5c0c0; color:#a32d2d; }
.fchip.fchip--gray  { background:#f5f2ee; border-color:#d4d0cb; color:#6b6560; }
.fchip-dot  { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.fd--green  { background:#1a8a7a; }
.fd--amber  { background:#e67e22; }
.fd--red    { background:#c0392b; }
.fd--gray   { background:#b0aba3; }
.fchip-count { background:rgba(0,0,0,.07); padding:1px 6px; border-radius:20px; font-size:9px; }
.sort-select { font-family:'Sora',sans-serif; font-size:11px; font-weight:600; color:#6b6560; background:white; border:1.5px solid #ddd8d0; border-radius:8px; padding:6px 10px; cursor:pointer; outline:none; transition:border-color .15s; }
.sort-select:focus { border-color:#1a8a7a; }
.grid-toggle { display:flex; gap:2px; background:white; border:1.5px solid #ddd8d0; border-radius:8px; padding:3px; margin-left:auto; }
.gt-btn { width:26px; height:26px; display:flex; align-items:center; justify-content:center; border-radius:5px; border:none; background:transparent; color:#9a9490; cursor:pointer; transition:all .15s; }
.gt-btn.active { background:#e6f5f2; color:#1a8a7a; }
.gt-btn:hover:not(.active) { background:#f5f2ee; color:#1a1714; }
.result-count { font-size:11px; font-weight:600; color:#9a9490; font-family:'IBM Plex Mono',monospace; }
@media (max-width:768px) { .filter-bar { padding:10px 16px; } }
@media (max-width:640px) { .filter-chips { display:none; } }
</style>
