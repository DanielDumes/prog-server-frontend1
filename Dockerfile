# Etapa 1: Construcción (Build)
FROM node:20-slim as build-stage

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código y construir el proyecto para producción
COPY . .
RUN npm run build

# Etapa 2: Producción (Servidor Nginx)
FROM nginx:stable-alpine as production-stage

# Copiar los archivos construidos desde la etapa anterior al directorio de Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
