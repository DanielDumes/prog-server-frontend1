/**
 * servers.js — Configuración central de la flota iLO 5
 * Agrega o quita servidores aquí. El dashboard los detecta automáticamente.
 */


// Detectar la IP del servidor automáticamente para evitar errores de conexión (localhost vs IP real)
const serverIP = window.location.hostname || 'localhost'
export const BACKEND_URL = `http://${serverIP}:5000`

// Intervalo de actualización automática (Sincronizado con el cronómetro real)
export const REFRESH_INTERVAL_SEC = 45
