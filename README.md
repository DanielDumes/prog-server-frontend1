# iLO 5 Dashboard

Dashboard de monitoreo para servidores HPE con iLO 5, usando la API REST Redfish.
Stack: **Vue 3 + Vite** (frontend) · **Python Flask** (backend proxy).

---

## Estructura del proyecto

```
ilo5-dashboard/
├── backend/
│   ├── app.py            ← Proxy Flask → iLO 5 API
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.vue       ← Dashboard completo
    │   └── main.js
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 1. Configurar el Backend (Flask)

### Instalación

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Variables de entorno

Crea un archivo `.env` o expórtalas directamente:

```bash
export ILO_HOST=192.168.1.100    # IP del iLO de tu servidor
export ILO_USER=Administrator
export ILO_PASS=tu_contraseña
```

O edita directamente las líneas en `app.py`:
```python
ILO_HOST = "192.168.1.100"
ILO_USER = "Administrator"
ILO_PASS = "tu_contraseña"
```

### Ejecutar

```bash
python app.py
# Backend corriendo en http://localhost:5000
```

---

## 2. Configurar el Frontend (Vue)

```bash
cd frontend
npm install
npm run dev
# Frontend corriendo en http://localhost:3000
```

---

## 3. Acceder al dashboard

Abre: **http://localhost:3000**

En el panel **⚙ Config** puedes cambiar en caliente:
- Host del iLO
- Usuario / contraseña
- Intervalo de actualización (por defecto: 60 minutos)

---

## Endpoints del Backend

| Endpoint              | Descripción                           |
|-----------------------|---------------------------------------|
| `GET /api/health`     | Verifica que el backend corre         |
| `GET /api/server/all` | Resumen + thermal + power (recomendado) |
| `GET /api/server/summary` | Estado general, CPU, memoria      |
| `GET /api/server/cpu` | Detalle de procesadores               |
| `GET /api/server/memory` | DIMMs de RAM                       |
| `GET /api/server/thermal` | Temperaturas y fans               |
| `GET /api/server/storage` | Controladores y discos            |
| `GET /api/server/power`   | Consumo eléctrico y PSUs          |

---

## Notas importantes

### CORS y SSL
- El iLO 5 usa certificados SSL **self-signed** → el backend deshabilita la verificación SSL automáticamente (solo para conexiones internas de red).
- El frontend **nunca** habla directo con el iLO; pasa siempre por el backend Flask para evitar problemas de CORS.

### Credenciales iLO
El usuario de iLO necesita al menos el privilegio **Read Only** para leer métricas. No requiere privilegios de administrador para el dashboard.

### Actualización automática
El dashboard se refresca automáticamente según el intervalo configurado (default: 60 min). El anillo de cuenta regresiva en el header muestra cuánto falta para el próximo refresh.

---

## Producción

Para producir el frontend:
```bash
cd frontend
npm run build
# Archivos estáticos en frontend/dist/
```

Luego sirve `frontend/dist/` con Nginx o directamente desde Flask:
```python
# En app.py, agrega:
from flask import send_from_directory

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_vue(path):
    if path and os.path.exists(f'../frontend/dist/{path}'):
        return send_from_directory('../frontend/dist', path)
    return send_from_directory('../frontend/dist', 'index.html')
```
