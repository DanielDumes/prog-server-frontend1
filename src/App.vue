<!--
  App.vue — Router raíz mínimo
  Alterna entre FleetView (lista de servidores) y DetailView (detalle de uno)
  Sin vue-router para mantener la instalación simple.
-->
<template>
  <FleetView
    v-if="currentView === 'fleet'"
    :refresh-count="refreshTrigger"
    @open-detail="openDetail"
    @open-reports="openReports"
  />
  <DetailView
    v-else-if="currentView === 'detail'"
    :server="selectedServer"
    :refresh-count="refreshTrigger"
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

const currentView = ref('fleet')
const selectedServer = ref(null)
const activeToasts = ref([])
const refreshTrigger = ref(0) // Incrementar para forzar refresh de datos

// Configuración de Socket.IO
onMounted(() => {
  // Ajusta la URL al puerto de tu backend
  const socket = io('http://localhost:5000')

  socket.on('new_alert', (alert) => {
    const id = Date.now() + Math.random()
    activeToasts.value.push({ ...alert, id })
    
    // Auto-eliminar tras 10 segundos
    setTimeout(() => removeToast(id), 10000)
    
    // Forzar actualización de la UI si es un evento de salud o conexión
    if (['ConnectionLoss', 'HealthDegradation', 'HealthRecovery', 'PowerStateChanged'].includes(alert.type)) {
      refreshTrigger.value++
    }
  })

  socket.on('fleet_update', () => {
    refreshTrigger.value++
  })

  socket.on('connect', () => console.log('[Socket] Conectado al backend'))
  socket.on('disconnect', () => console.log('[Socket] Desconectado'))
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
