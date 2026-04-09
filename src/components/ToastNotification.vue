<template>
  <TransitionGroup name="toast-list" tag="div" class="toast-container">
    <div v-for="t in toasts" :key="t.id" :class="['toast-item', (t.severity || 'info').toLowerCase()]">
      <div class="toast-icon">
        <span v-if="t.severity === 'Critical'">🔴</span>
        <span v-else-if="t.severity === 'Warning'">🟠</span>
        <span v-else>🔵</span>
      </div>
      <div class="toast-content">
        <div class="toast-header">
          <strong>{{ t.server_label }}</strong>
          <span class="toast-type">{{ t.type }}</span>
        </div>
        <div class="toast-body">{{ t.details }}</div>
      </div>
      <button class="toast-close" @click="remove(t.id)">&times;</button>
    </div>
  </TransitionGroup>
</template>

<script setup>
defineProps({
  toasts: Array
})
const emit = defineEmits(['close'])

const remove = (id) => {
  emit('close', id)
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 380px;
}

.toast-item {
  background: var(--surface);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-left: 4px solid #6366f1;
  border-radius: 8px;
  padding: 1rem;
  color: var(--text);
  display: flex;
  gap: 1rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
}

.toast-item.critical { border-left-color: #ef4444; }
.toast-item.warning  { border-left-color: #f59e0b; }
.toast-item.info     { border-left-color: #3b82f6; }

.toast-icon { font-size: 1.2rem; }

.toast-content { flex: 1; min-width: 0; }

.toast-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  gap: 1rem;
}

.toast-header strong { font-size: 0.95rem; font-weight: 600; }

.toast-type {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
}

.toast-body {
  font-size: 0.85rem;
  opacity: 0.8;
  line-height: 1.4;
  word-break: break-word;
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-3);
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.5;
  padding: 0 0.25rem;
  align-self: flex-start;
}
.toast-close:hover { opacity: 1; }

/* Transitions */
.toast-list-enter-active, .toast-list-leave-active { transition: all 0.4s ease; }
.toast-list-enter-from { opacity: 0; transform: translateX(30px) scale(0.9); }
.toast-list-leave-to   { opacity: 0; transform: translateX(30px) scale(0.9); }
</style>
