# GestApp - Gestión de Gastos Personales

Aplicación completa para gestión de gastos personales con backend NestJS, frontend Angular y PostgreSQL, orquestados con Docker.

## 🚀 Características

- ✅ Backend API REST con NestJS + TypeScript
- ✅ Frontend Angular con diseño moderno y responsive
- ✅ Base de datos PostgreSQL
- ✅ Integración con Gemini AI para registro por voz
- ✅ Speech-to-text nativo del navegador
- ✅ Exportación de backups en formato SQL
- ✅ Validaciones en frontend y backend
- ✅ Compatible con móviles
- ✅ Listo para producción con CORS configurado

## 📋 Requisitos

- Docker y Docker Compose
- API Key de Gemini (Google AI Studio) - Obtén una en: https://makersuite.google.com/app/apikey

## 🔧 Instalación y Despliegue

### 1. Configurar variables de entorno

```bash
# Editar el archivo .env y agregar tu GEMINI_API_KEY
nano .env
```

Reemplaza `tu_api_key_aqui` con tu API key de Gemini.

### 2. Levantar los servicios con Docker

```bash
# Construir y levantar todos los servicios
docker compose up -d --build
```

### 3. Verificar que todo esté corriendo

```bash
docker compose ps
```

Deberías ver 3 contenedores corriendo:
- `gestapp-db` (PostgreSQL)
- `gestapp-backend` (NestJS)
- `gestapp-frontend` (Angular + Nginx)

### 4. Ver logs (opcional)

```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend
```

## 🌐 Acceso

- **Frontend**: http://tu-ip-del-droplet (puerto 80)
- **Backend API**: http://tu-ip-del-droplet:3000
- **API Docs (Swagger)**: http://tu-ip-del-droplet:3000/api/docs

## 📱 Uso de la Aplicación

### Modo Manual
1. Selecciona una categoría
2. Usa el botón 🎤 para dictar la descripción (opcional)
3. Completa los demás campos manualmente
4. Presiona "💾 Guardar"

### Modo IA con Gemini
1. Cambia al modo "🤖 IA con Gemini"
2. Presiona el botón grande de micrófono
3. Di algo como:
   - "Ayer gasté 2500 pesos en un helado"
   - "Hoy recibí mi salario de 3500000 pesos"
   - "Gasté 15000 en gasolina"
4. La IA completará automáticamente el formulario
5. Verifica la información y presiona "✅ Confirmar y Guardar"

### Descargar Backup
- Presiona el botón "📥 Descargar Backup SQL"
- Se descargará un archivo `.sql` con todas tus transacciones

## 🔄 Comandos Útiles

### Detener la aplicación
```bash
docker compose down
```

### Reiniciar un servicio
```bash
docker compose restart backend
docker compose restart frontend
```

### Ver estado de los contenedores
```bash
docker compose ps
```

### Limpiar todo (incluida la BD)
```bash
docker compose down -v
```

### Reconstruir después de cambios en el código
```bash
docker compose up -d --build
```

## 📝 Estructura del Proyecto

```
gestapp/
├── backend/                # API NestJS
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── transactions/   # Módulo de transacciones
│   │   └── gemini/         # Módulo de IA
│   ├── Dockerfile
│   └── package.json
├── frontend/               # App Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   └── services/
│   │   └── environments/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .env
└── README.md
```

## 🔐 Seguridad para Producción

1. **Cambia las credenciales de PostgreSQL** en `docker-compose.yml`
2. **Mantén tu GEMINI_API_KEY segura** - No la subas a GitHub
3. **Configura el firewall** de tu droplet:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```
4. **Considera usar HTTPS** con Let's Encrypt

## 📞 API Endpoints

### Transacciones
- `GET /transactions` - Listar todas las transacciones
- `POST /transactions` - Crear nueva transacción
- `GET /transactions/:id` - Obtener transacción por ID
- `PATCH /transactions/:id` - Actualizar transacción
- `DELETE /transactions/:id` - Eliminar transacción
- `GET /transactions/export/sql` - Exportar backup SQL

### Gemini AI
- `POST /gemini/parse` - Parsear texto con IA
  ```json
  {
    "userInput": "Ayer gasté 2500 pesos en un helado"
  }
  ```

## 🐛 Solución de Problemas

### El frontend no carga
```bash
docker compose logs frontend
# Verifica que nginx esté corriendo
```

### Error de conexión a la base de datos
```bash
docker compose logs postgres
# Verifica que postgres esté healthy
docker compose ps
```

### Error con Gemini API
- Verifica que tu API key sea válida
- Revisa los logs: `docker compose logs backend`
- Asegúrate de tener créditos en tu cuenta de Google AI

### El micrófono no funciona
- Usa HTTPS (los navegadores requieren HTTPS para micrófono)
- Verifica permisos del navegador
- Prueba en Chrome o Edge (mejor soporte)

## 🌍 Acceso desde otros dispositivos

Para acceder desde otros dispositivos en la red:
1. Encuentra la IP de tu droplet
2. Accede desde cualquier dispositivo: `http://IP_DEL_DROPLET`

## 📊 Base de Datos

La base de datos almacena:
- **ID**: UUID único
- **Categoría**: Necesidad, Lujo, Ahorro, Entrada
- **Descripción**: Texto descriptivo
- **Tipo**: Ingreso, Egreso, Ahorro
- **Monto**: Valor en COP
- **Medio**: Efectivo, NU, Daviplata, Nequi, BBVA, etc.
- **Fecha**: Fecha de la transacción
- **Observaciones**: Notas adicionales
- **Valor**: Monto calculado (negativo para egresos)

## 🎨 Características de UI/UX

- Diseño moderno y atractivo
- Animaciones suaves
- Feedback visual inmediato
- Totalmente responsive (móvil, tablet, desktop)
- Accesible y fácil de usar
- Soporte para modo oscuro del sistema

## 📄 Licencia

Este proyecto es de uso personal.

---

**Hecho con ❤️ usando NestJS, Angular y Docker**
