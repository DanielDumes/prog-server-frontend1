<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">Agregar servidor</span>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div class="field">
          <label>Etiqueta</label>
          <input v-model="form.label" placeholder="SRV-PROD-04" />
        </div>
        <div class="field">
          <label>IP del iLO <span class="required">*</span></label>
          <input v-model="form.host" placeholder="10.10.10.10" />
        </div>
        <div class="field">
          <label>Usuario <span class="required">*</span></label>
          <input v-model="form.user" placeholder="Administrator" />
        </div>
        <div class="field">
          <label>Contraseña <span class="required">*</span></label>
          <input v-model="form.pass" type="password" placeholder="••••••••" />
        </div>

        <div class="modal-hint">
          Las credenciales se guardan en el servidor y no se vuelven a pedir.
          Se verifica la conexión antes de guardar.
        </div>

        <div class="modal-error" v-if="error">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L14.5 13.5H1.5L8 2Z" stroke="#a32d2d" stroke-width="1.3" fill="none"/>
            <path d="M8 6.5V9.5M8 11V11.5" stroke="#a32d2d" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          {{ error }}
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn" @click="$emit('close')">Cancelar</button>
        <button class="btn btn--primary" @click="submit" :disabled="loading">
          <span v-if="loading" class="spin">↻</span>
          {{ loading ? 'Verificando…' : 'Agregar servidor' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useIlo } from '../composables/useIlo.js'

const emit = defineEmits(['close', 'added'])
const { addServer } = useIlo()

const form = ref({ label: '', host: '', user: '', pass: '' })
const loading = ref(false)
const error   = ref(null)

async function submit() {
  if (!form.value.host || !form.value.user || !form.value.pass) {
    error.value = 'IP, usuario y contraseña son obligatorios'
    return
  }
  loading.value = true
  error.value   = null
  try {
    const srv = await addServer({
      label: form.value.label || form.value.host,
      host:  form.value.host,
      user:  form.value.user,
      pass:  form.value.pass,
    })
    emit('added', srv)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,.35);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal {
  background: #fff; border-radius: 12px;
  border: 0.5px solid #e8e8e5;
  width: 100%; max-width: 420px;
  display: flex; flex-direction: column;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 0.5px solid #f0f0ed;
}
.modal-title { font-size: 15px; font-weight: 600; }
.btn-close {
  background: none; border: none; font-size: 16px;
  color: #888780; cursor: pointer; padding: 2px 6px;
  border-radius: 4px;
}
.btn-close:hover { background: #f5f5f3; }

.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 12px; font-weight: 500; color: #5f5e5a; }
.required { color: #a32d2d; }
.field input {
  padding: 8px 12px; border-radius: 8px;
  border: 0.5px solid #d1d1cc; font-size: 14px;
  font-family: inherit; outline: none;
  transition: border-color .15s;
}
.field input:focus { border-color: #378add; }

.modal-hint {
  font-size: 12px; color: #b4b2a9; line-height: 1.5;
  padding: 10px 12px; background: #f9f9f7;
  border-radius: 6px; border: 0.5px solid #e8e8e5;
}
.modal-error {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; color: #a32d2d; padding: 10px 12px;
  background: #fcebeb; border-radius: 6px;
  border: 0.5px solid #f7c1c1;
}

.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 20px; border-top: 0.5px solid #f0f0ed;
}
.btn {
  font-size: 13px; padding: 7px 16px; border-radius: 8px;
  border: 0.5px solid #d1d1cc; background: #fff;
  color: #1a1a1a; cursor: pointer; font-family: inherit;
  transition: background .15s;
}
.btn:hover:not(:disabled) { background: #f5f5f3; }
.btn:disabled { opacity: .5; cursor: wait; }
.btn--primary { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
.btn--primary:hover:not(:disabled) { background: #333; }
.spin { display: inline-block; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>