# Control Tower - Frontend

Interfaz gráfica (Cliente) para **Control Tower**, la plataforma unificada de monitoreo en tiempo real para flotas de servidores HPE (iLO 4, 5 y 6).

Este proyecto está construido con **Vue 3** (Composition API) y empaquetado con **Vite**. Se comunica con el backend interactuando con una API RESTful y recibiendo eventos en tiempo real a través de **Socket.IO**.

---

## Estructura del Frontend

```
fronted/
├── src/
│   ├── components/       ← Componentes reutilizables (ej. ServerCard, ToastNotification)
│   ├── composables/      ← Lógica compartida (ej. useIlo.js para llamadas a la API)
│   ├── views/            ← Vistas principales (FleetView, DetailView, ReportsView)
│   ├── App.vue           ← Componente raíz (Router interno + conexión Socket.IO)
│   └── main.js           ← Punto de entrada
├── index.html
├── vite.config.js
└── package.json
```

---

## 1. Tecnologías Clave

-   **Vue 3 (Composition API)**: Para el manejo reactivo de los datos de la flota en tiempo real.
-   **Socket.IO Client**: Conexión por WebSockets con el backend para recibir notificaciones (alertas de salud, cambios de estado de energía) sin necesidad de recargar la página.
-   **CSS Nativo Moderno**: Uso de variables CSS, modo oscuro/claro automático y tipografías personalizadas (Outfit) sin dependencias adicionales de frameworks CSS pesados.

---

## 2. Configuración y Desarrollo

### Requisitos Previos
- Node.js (versión 18 o superior).
- El backend configurado y corriendo (por defecto en `http://localhost:5000`).

### Instalación

```bash
cd fronted
npm install
```

### Arrancar Servidor de Desarrollo

```bash
npm run dev
```

El servidor local de Vite arrancará en `http://localhost:3000` (o `5173` si está ocupado).
Si necesita comunicarse con un backend que corre en una IP distinta a `localhost`, configure las rutas en los endpoints dentro de los archivos `src/composables/useIlo.js` y `src/App.vue` (en la conexión del socket).

---

## 3. Embalaje para Producción (Build)

Para generar los archivos estáticos listos para producción:

```bash
npm run build
```

Esto generará la carpeta `dist/` que contiene la aplicación optimizada y minificada.
Puede servir esta carpeta utilizando un servidor web como **Nginx**, **Apache**, o mediante el propio backend sirviéndola como contenido estático si se ha configurado para ello usando Docker.

---

## Notas de Arquitectura (Revisión Reciente)

-   **Navegación Interna**: El frontend no utiliza librerías de enrutamiento pesadas (como vue-router) para mantener la ligereza del proyecto; en su lugar, `App.vue` orquesta condicionalmente las Vistas y pasa el estado.
-   **Sincronización:** Cuando el sistema pierde la conexión WebSocket, intentará restablecerla; una vez reconectado, recarga la flota de forma inteligente para no dejar al usuario visualizando datos estancados.
-   **Gestión del DOM**: Se han eliminado los intervalos (polling manuales) previamente existentes. Todo es dirigido por los empujes (`push`) del backend (daemon).
