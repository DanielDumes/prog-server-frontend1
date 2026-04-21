<!--
  App.vue — Router raíz mínimo
  Alterna entre FleetView (lista de servidores) y DetailView (detalle de uno)
  Sin vue-router para mantener la instalación simple.
-->
<template>
  <FleetView
    v-if="currentView === 'fleet'"
    :servers="servers"
    :loading="loading"
    :refresh-count="refreshTrigger"
    :heartbeat="lastHeartbeat"
    :pushed-summaries="pushedSummaries"
    @open-detail="openDetail"
    @open-reports="openReports"
    @server-deleted="refreshInventory"
    @server-added="refreshInventory"
  />
  <DetailView
    v-else-if="currentView === 'detail'"
    :server="selectedServer"
    :refresh-count="refreshTrigger"
    :heartbeat="lastHeartbeat"
    :pushed-summaries="pushedSummaries"
    @back="closeToFleet"
  />
  <ReportsView
    v-else-if="currentView === 'reports'"
    @back="closeToFleet"
  />
  <ToastNotification :toasts="activeToasts" @close="removeToast" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { io } from 'socket.io-client'
import FleetView  from './views/FleetView.vue'
import DetailView from './views/DetailView.vue'
import ReportsView from './views/ReportsView.vue'
import ToastNotification from './components/ToastNotification.vue'
import { useIlo } from './composables/useIlo.js'

const currentView = ref('fleet')
const selectedServer = ref(null)
const activeToasts = ref([])
const refreshTrigger = ref(0) 
const lastHeartbeat = ref(localStorage.getItem('last_fleet_heartbeat') || '') 
const pushedSummaries = ref([])
const servers = ref([])
const loading = ref(true)

const { getHealth, getServers } = useIlo()

async function refreshInventory() {
  loading.value = true
  try {
    servers.value = await getServers()
  } catch (e) {
    console.error("Error cargando inventario:", e)
  } finally {
    loading.value = false
  }
}

// Configuración de Socket.IO
onMounted(async () => {
  // 1. Cargar inventario inicial
  await refreshInventory()

  // 2. Obtener estado inicial fresco (actualiza lo que hay en localStorage)
  try {
    const health = await getHealth()
    if (health.last_fleet_update) {
      let ts = health.last_fleet_update
      if (typeof ts === 'string' && !ts.includes('Z') && !ts.includes('+')) {
        ts = ts.trim() + 'Z'
      }
      const date = new Date(ts)
      const timeStr = date.toLocaleTimeString('es-EC', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
      lastHeartbeat.value = timeStr
      localStorage.setItem('last_fleet_heartbeat', timeStr)
    }
  } catch (e) {
    console.error("Error obteniendo heartbeat inicial:", e)
  }

  // 3. Conectar socket
  const socket = io('http://localhost:5000')

  socket.on('new_alert', (alert) => {
    const id = Date.now() + Math.random()
    activeToasts.value.push({ ...alert, id })
    setTimeout(() => removeToast(id), 10000)
    
    if (['ConnectionLoss', 'HealthDegradation', 'HealthRecovery', 'PowerStateChanged'].includes(alert.type)) {
      refreshTrigger.value++
    }
  })

  socket.on('fleet_update', (data) => {
    if (data.timestamp) {
      let ts = data.timestamp
      if (typeof ts === 'string' && !ts.includes('Z') && !ts.includes('+')) {
        ts = ts.trim() + 'Z'
      }
      const date = new Date(ts)
      const timeStr = date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
      lastHeartbeat.value = timeStr
      localStorage.setItem('last_fleet_heartbeat', timeStr)
    }
    
    if (data.summaries) {
      pushedSummaries.value = data.summaries
    }
    refreshTrigger.value++
  })

  // Al conectar: si ya hubo una conexión previa (reconexión tras reinicio del backend),
  // recargar inventario y heartbeat automáticamente sin que el usuario tenga que refrescar.
  let isFirstConnect = true
  socket.on('connect', async () => {
    console.log('[Socket] Conectado al backend')
    if (isFirstConnect) {
      isFirstConnect = false
      return
    }
    // ── Reconexión: recargar todo ──
    console.log('[Socket] Reconectado — recargando datos automáticamente...')
    await refreshInventory()
    try {
      const health = await getHealth()
      if (health.last_fleet_update) {
        let ts = health.last_fleet_update
        if (typeof ts === 'string' && !ts.includes('Z') && !ts.includes('+')) ts = ts.trim() + 'Z'
        const timeStr = new Date(ts).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
        lastHeartbeat.value = timeStr
        localStorage.setItem('last_fleet_heartbeat', timeStr)
      }
    } catch (e) {
      console.warn('[Socket] No se pudo obtener heartbeat tras reconexión:', e)
    }
    refreshTrigger.value++
  })

  socket.on('disconnect', () => console.log('[Socket] Desconectado — esperando reconexión...'))
})

function removeToast(id) {
  activeToasts.value = activeToasts.value.filter(t => t.id !== id)
}

function openDetail(server) {
  selectedServer.value = server
  currentView.value = 'detail'
}

function closeToFleet() {
  selectedServer.value = null
  currentView.value = 'fleet'
}

function openReports() {
  currentView.value = 'reports'
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--page); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-3); }
</style>
