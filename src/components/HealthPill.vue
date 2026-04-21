<template>
  <span class="pill" :class="`pill--${cls}`">
    <span class="pill-dot"></span>
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ health: String })

const map = {
  ok:       { cls: 'ok',      label: 'OK'          },
  warning:  { cls: 'warn',    label: 'Advertencia' },
  caution:  { cls: 'warn',    label: 'Advertencia' },
  critical: { cls: 'crit',    label: 'Crítico'     },
  on:       { cls: 'ok',      label: 'On'          },
  apagado:  { cls: 'off',     label: 'Apagado'     },
  off:      { cls: 'off',     label: 'Offline'     },
}

const entry  = computed(() => map[(props.health || '').toLowerCase()] ?? { cls: 'unknown', label: props.health || 'N/A' })
const cls    = computed(() => entry.value.cls)
const label  = computed(() => entry.value.label)
</script>