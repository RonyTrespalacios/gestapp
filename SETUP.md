# GestApp - Sistema de Gestión Financiera Personal

Sistema completo de gestión de gastos personales con autenticación, IA (Gemini) y HTTPS.

## 🚀 Características Implementadas

### Seguridad
- ✅ Sistema completo de autenticación con JWT
- ✅ Registro de usuarios con verificación por email
- ✅ Contraseñas encriptadas con bcrypt
- ✅ Endpoints protegidos por autenticación
- ✅ Aislamiento total de datos por usuario
- ✅ Protección contra inyección SQL (TypeORM)
- ✅ Listo para HTTPS con Cloudflare (SSL automático)
- ✅ Headers de seguridad configurados

### Funcionalidades
- ✅ Registro manual de transacciones
- ✅ Registro con IA (Gemini)
- ✅ Visualización de datos en tabla responsive
- ✅ Exportar/Importar CSV y XLSX
- ✅ Cada usuario tiene sus propios datos
- ✅ Interfaz moderna con estética pixel art

## 📋 Requisitos Previos

- Docker y Docker Compose
- Node.js 18+ (solo para desarrollo local del frontend)

## 🔧 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Gemini API
GEMINI_API_KEY=tu_api_key_aqui

# JWT Secret (cambiar en producción)
JWT_SECRET=tu_secreto_super_seguro_aqui

# Email Configuration (opcional para desarrollo)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Frontend URL (para emails de verificación)
FRONTEND_URL=https://localhost
```

## 🚀 Inicio Rápido

### Opción 1: Docker Compose (Recomendado)

```bash
# 1. Clonar el repositorio
git clone <tu-repo>
cd gestapp

# 2. Crear archivo .env con tus credenciales
cp .env.example .env
# Editar .env con tus valores

# 3. Levantar todos los servicios
docker compose up -d --build

# 4. Acceder a la aplicación
# Frontend: http://localhost
# Backend API: http://localhost:3000
```

### Opción 2: Desarrollo Local (solo frontend)

```bash
# Backend y DB en Docker
docker compose up -d --build backend postgres

# Frontend local
cd frontend
npm install
npm run dev
```

## 📖 Uso

### 1. Registro de Usuario
1. Ir a http://localhost
2. Click en "Registro" en el sidebar
3. Completar formulario (email, contraseña, nombre opcional)
4. Verificar email (en desarrollo, el link se muestra en los logs del backend)

### 2. Login
1. Click en "Login" en el sidebar
2. Ingresar credenciales
3. Acceder a las funciones protegidas

### 3. Registrar Transacciones
- **Manual**: Formulario tradicional con todos los campos
- **Con IA**: Descripción en lenguaje natural, Gemini extrae los datos

### 4. Ver y Exportar Datos
- Ver tabla con historial
- Descargar en CSV o XLSX
- Importar datos desde archivo

## 🔒 Seguridad

### HTTPS en Producción
- **Desarrollo**: HTTP simple en localhost
- **Producción**: Usar Cloudflare (SSL automático y gratuito)
  - Cloudflare maneja todos los certificados SSL
  - Tus usuarios siempre verán 🔒 candado verde
  - Sin configuración adicional necesaria
  - Se renueva automáticamente

### Email de Verificación
- Si no configuras EMAIL_USER/EMAIL_PASS, los links aparecen en los logs
- Para producción, configura SMTP (Gmail, SendGrid, etc.)

## 🏗️ Arquitectura

```
gestapp/
├── backend/          # NestJS + TypeORM + PostgreSQL
│   ├── src/
│   │   ├── auth/     # Autenticación JWT
│   │   ├── users/    # Gestión de usuarios
│   │   ├── transactions/  # CRUD transacciones
│   │   └── gemini/   # Integración IA
├── frontend/         # Angular 18 standalone
│   ├── src/app/
│   │   ├── components/  # Login, Register, Forms, Table
│   │   ├── services/    # Auth, Transaction
│   │   ├── guards/      # Auth Guard
│   │   └── interceptors/  # JWT Interceptor
└── docker-compose.yml
```

## 🛠️ Comandos Útiles

```bash
# Ver logs
docker compose logs -f

# Ver logs del backend solamente
docker compose logs -f backend

# Reconstruir después de cambios
docker compose up -d --build

# Parar servicios
docker compose down

# Limpiar todo (¡cuidado! elimina datos)
docker compose down -v
```

## 🐛 Solución de Problemas

### Error "Cannot GET /api/..."
- Asegúrate de estar autenticado
- Verifica que el token JWT esté en el localStorage
- Revisa que el backend esté corriendo

### "Email no verificado"
- Busca el link de verificación en los logs del backend:
  ```bash
  docker compose logs backend | grep "Verification URL"
  ```

## 📝 Notas de Desarrollo

- **TypeORM** previene inyección SQL automáticamente
- **bcrypt** con 10 salt rounds para contraseñas
- **JWT** con expiración de 7 días
- **Tokens de verificación** expiran en 24 horas
- **CORS** configurado para desarrollo

## 🚀 Producción

### Deployment Rápido con Cloudflare (Recomendado):

1. **Comprar dominio** (~$12/año en Namecheap/GoDaddy)
2. **Configurar Cloudflare** (gratis):
   - Crear cuenta en cloudflare.com
   - Agregar tu dominio
   - Cambiar nameservers a Cloudflare
   - Configurar DNS:
     ```
     Tipo: A
     Nombre: @
     Valor: IP_de_tu_servidor
     Proxy: ✅ Activado (naranja)
     ```
   - SSL/TLS → Seleccionar "Flexible"
3. **Desplegar app**:
   ```bash
   docker compose up -d
   ```
4. **Configurar variables de entorno seguras**:
   - Cambiar `JWT_SECRET` a un valor seguro
   - Configurar SMTP real para emails
   - Usar `synchronize: false` en TypeORM
   - Configurar migraciones
5. **¡Listo!** - Tus usuarios verán 🔒 candado verde

### Tiempo Total: ~30 minutos | Costo: ~$12/año (solo el dominio)

## 📄 Licencia

MIT

## 👤 Autor

GestApp - Sistema de Gestión Personal

