/**
 * useIlo.js — Composable reutilizable para consultar la API del backend iLO 5
 * Cada componente/vista lo puede usar de forma independiente.
 */
import { ref } from 'vue'
import { BACKEND_URL } from '../config/servers.js'

export function useIlo() {

  // Servidores guardados en el backend
  async function getServers() {
    const res = await fetch(`${BACKEND_URL}/api/servers`)
    if (!res.ok) throw new Error('Error cargando servidores')
    return res.json()
  }

  async function addServer({ label, host, user, pass }) {
    const res = await fetch(`${BACKEND_URL}/api/servers`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ label, host, user, pass }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data
  }

  async function deleteServer(id) {
    await fetch(`${BACKEND_URL}/api/servers/${id}`, { method: 'DELETE' })
  }

  // Datos de un servidor por ID (credenciales viven en el backend)
  async function fetchSummary(server) {
    const res = await fetch(`${BACKEND_URL}/api/servers/${server.id}/summary`)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `HTTP ${res.status}`)
    }
    return res.json()
  }

  async function fetchAll(server) {
    const [summary, storage, memory] = await Promise.all([
      fetch(`${BACKEND_URL}/api/servers/${server.id}/summary`).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/servers/${server.id}/storage`).then(r => r.json()).catch(() => null),
      fetch(`${BACKEND_URL}/api/servers/${server.id}/memory`).then(r => r.json()).catch(() => null),
    ])
    return { ...summary, storage, memory }
  }

  async function fetchMetrics(id, days = 1) {
    const res = await fetch(`${BACKEND_URL}/api/reports/metrics?server_id=${id}&days=${days}`)
    if (!res.ok) throw new Error('Error cargando métricas históricas')
    return res.json()
  }

  return { getServers, addServer, deleteServer, fetchSummary, fetchAll, fetchMetrics }
}