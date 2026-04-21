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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, host, user, pass }),
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
    // Hacemos las tres peticiones en paralelo, pero manejamos
    // el summary como Response para revisar el status HTTP.
    const [summaryRes, storage, memory] = await Promise.all([
      fetch(`${BACKEND_URL}/api/servers/${server.id}/summary`),
      fetch(`${BACKEND_URL}/api/servers/${server.id}/storage`).then(r => r.json()).catch(() => null),
      fetch(`${BACKEND_URL}/api/servers/${server.id}/memory`).then(r => r.json()).catch(() => null),
    ])

    // Si el summary falla (ej. servidor recién agregado aún sin datos en DB),
    // lanzamos el error para que load() lo capture y muestre el error bar.
    if (!summaryRes.ok) {
      const body = await summaryRes.json().catch(() => ({}))
      throw new Error(body.error || `HTTP ${summaryRes.status}`)
    }

    const summary = await summaryRes.json()
    return { ...summary, storage, memory }
  }

  /**
   * Reintenta SOLO storage y memory (datos lentos).
   * Usado cuando se agrega un servidor nuevo y el deep-poll del backend aún no terminó.
   */
  async function fetchHardwareOnly(server) {
    const [storage, memory] = await Promise.all([
      fetch(`${BACKEND_URL}/api/servers/${server.id}/storage`).then(r => r.json()).catch(() => null),
      fetch(`${BACKEND_URL}/api/servers/${server.id}/memory`).then(r => r.json()).catch(() => null),
    ])
    return { storage, memory }
  }

  async function fetchMetrics(id, days = 1) {
    const res = await fetch(`${BACKEND_URL}/api/reports/metrics?server_id=${id}&days=${days}`)
    if (!res.ok) throw new Error('Error cargando métricas históricas')
    return res.json()
  }


  async function getHealth() {
    const res = await fetch(`${BACKEND_URL}/api/health`)
    if (!res.ok) throw new Error('Error al conectar con el backend')
    return res.json()
  }

  return { getServers, addServer, deleteServer, fetchSummary, fetchAll, fetchHardwareOnly, fetchMetrics, getHealth }
}
