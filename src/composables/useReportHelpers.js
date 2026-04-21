/**
 * useReportHelpers.js
 * Funciones helper puras compartidas entre los tabs de ReportsView
 */
export function useReportHelpers() {

  function typeLbl(t) {
    return {
      ConnectionLoss:    'Desconexión',
      HealthDegradation: 'Degradación',
      HealthRecovery:    'Recuperación',
      PowerStateChanged: 'Energía',
      HealthChange:      'Cambio Health',
    }[t] || t
  }

  function typeCls(t) {
    return {
      ConnectionLoss:    'chip--warn',
      HealthDegradation: 'chip--crit',
      HealthRecovery:    'chip--ok',
      PowerStateChanged: 'chip--warn',
      HealthChange:      'chip--warn',
    }[t] || ''
  }

  function stateCls(s) {
    return { OK: 'tc-ok', Warning: 'tc-warn', Critical: 'tc-crit', Offline: 'tc-off', Off: 'tc-crit' }[s] || ''
  }

  function healthLabel(h) {
    return { OK: 'Óptimo', Warning: 'Advertencia', Critical: 'Crítico' }[h] || h || '—'
  }

  function healthCls(h) {
    return { OK: 'tc-ok', Warning: 'tc-warn', Critical: 'tc-crit' }[h] || ''
  }

  function tempCls(t) {
    if (t == null) return ''
    if (t > 80)   return 'tc-crit'
    if (t > 65)   return 'tc-warn'
    return 'tc-ok'
  }

  function cellCls(status) {
    if (!status)              return 'cell--empty'
    if (status === 'OK')      return 'cell--ok'
    if (status === 'Warning') return 'cell--warn'
    if (status === 'Critical')return 'cell--crit'
    if (status === 'Offline') return 'cell--off'
    if (status === 'Off')     return 'cell--crit'
    return ''
  }

  function formatTime(iso) {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleString('es-EC', {
        timeZone: 'America/Guayaquil',
        day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit',
        hour12: false,
      })
    } catch (e) { return '—' }
  }

  function formatTimeOnly(iso) {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleTimeString('es-EC', {
        timeZone: 'America/Guayaquil',
        hour: '2-digit', minute: '2-digit',
        hour12: false,
      })
    } catch (e) { return '—' }
  }

  function formatDateLong(dateStr) {
    const [y, m, d] = dateStr.split('-')
    const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    return `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`
  }

  return {
    typeLbl, typeCls, stateCls,
    healthLabel, healthCls,
    tempCls, cellCls,
    formatTime, formatTimeOnly, formatDateLong,
  }
}
