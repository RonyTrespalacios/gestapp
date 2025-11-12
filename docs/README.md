# 💰 GestApp - Gestión Inteligente de Gastos Personales

Sistema completo de gestión de gastos con IA, reconocimiento de voz y categorización automática usando Gemini AI.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ Características

- 🎤 **Reconocimiento de voz en tiempo real** - Habla tus gastos naturalmente
- 🤖 **IA con Gemini 2.0 Flash** - Categorización automática inteligente
- 🎨 **Interfaz moderna con theme oscuro** - Diseño profesional con particles.js
- 💬 **Chat interface** - Interfaz conversacional intuitiva
- 📊 **Categorización automática** - Necesidad, Lujo, Ahorro, Entrada
- 💾 **Backend robusto** - NestJS + PostgreSQL
- 🐳 **Docker Ready** - Deploy con un solo comando
- 📱 **Responsive** - Funciona en desktop, tablet y móvil

---

## 🚀 Inicio Rápido con Docker

### 1. Prerequisitos
- Docker y Docker Compose instalados
- API Key de Gemini (gratuita)

### 2. Configurar API Key

Obtén tu API Key gratuita en: https://makersuite.google.com/app/apikey

Crea un archivo `.env` en la raíz del proyecto:
```bash
echo "GEMINI_API_KEY=tu_api_key_aqui" > .env
```

### 3. Iniciar la Aplicación

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**O manualmente:**
```bash
docker-compose build
docker-compose up -d
```

### 4. Acceder

- 🌐 **Frontend**: http://localhost
- 📚 **API Docs**: http://localhost/api/docs

---

## 📁 Estructura del Proyecto

```
gestapp/
├── backend/                 # Backend NestJS
│   ├── src/
│   │   ├── gemini/         # Módulo de Gemini AI
│   │   ├── transactions/   # Módulo de transacciones
│   │   └── main.ts         # Entry point (con prefijo /api)
│   ├── Dockerfile
│   └── package.json
│
├── frontend/               # Frontend Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   └── transaction-form/  # Formulario + Chat
│   │   │   ├── services/
│   │   │   │   ├── gemini.service.ts  # Cliente API Gemini
│   │   │   │   ├── speech.service.ts  # Reconocimiento de voz
│   │   │   │   └── particles.service.ts # Particles.js
│   │   │   └── app.component.ts
│   │   └── environments/
│   ├── nginx.conf          # Configuración de proxy
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml      # Orquestación de servicios
├── .env                    # Variables de entorno (NO subir a git)
├── .env.example            # Plantilla de variables
├── start.sh               # Script de inicio (Linux/Mac)
├── start.bat              # Script de inicio (Windows)
├── INSTALACION_DOCKER.md  # Guía detallada de Docker
└── README.md              # Este archivo
```

---

## 🛠️ Stack Tecnológico

### Backend
- **NestJS** - Framework Node.js
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos
- **Google Generative AI** - Gemini 2.0 Flash
- **Swagger** - Documentación API

### Frontend
- **Angular 17** - Framework frontend
- **Particles.js** - Animaciones de fondo
- **Web Speech API** - Reconocimiento de voz
- **SCSS** - Estilos avanzados
- **Nginx** - Servidor web + reverse proxy

### DevOps
- **Docker** - Containerización
- **Docker Compose** - Orquestación
- **Multi-stage builds** - Optimización de imágenes

---

## 💬 Cómo Funciona el Chat

### Flujo de Uso

1. **Usuario activa el micrófono** 🎤
2. **Habla su transacción**: *"Ayer gasté 2500 en helado"*
3. **El texto se captura en tiempo real** y aparece en el input
4. **Usuario presiona enviar** ➤
5. **Frontend envía al backend** vía `/api/gemini/parse`
6. **Backend procesa con Gemini AI** y devuelve JSON estructurado
7. **Frontend muestra la respuesta** categorizada
8. **Usuario revisa y guarda** 💾

### Ejemplo de Conversación

```
Usuario 🎤: "Ayer gasté 2500 pesos en un helado"

Asistente 🤖: ✅ Transacción procesada:
              Categoría: Lujo
              Descripción: Comida rica
              Tipo: Egreso
              Monto: $2,500 COP
              Medio: Efectivo
              Fecha: 2025-11-09
```

---

## 🔧 Desarrollo Local (Sin Docker)

### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
export DATABASE_HOST=localhost
export DATABASE_PORT=5432
export DATABASE_USER=gestapp_user
export DATABASE_PASSWORD=gestapp_password
export DATABASE_NAME=gestapp
export GEMINI_API_KEY=tu_api_key
export PORT=3000

# Iniciar en modo desarrollo
npm run start:dev
```

Backend estará en: http://localhost:3000/api

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm start
```

Frontend estará en: http://localhost:4200

---

## 🎨 Diseño Visual

### Theme Oscuro
- **Background**: Degradado oscuro (`#0f172a` → `#1e293b`)
- **Primary Color**: Indigo (`#6366f1`)
- **Secondary Color**: Purple (`#8b5cf6`)
- **Surface**: Slate (`#1e293b`)

### Particles Background
- Partículas animadas en el fondo
- Interactivas con el mouse
- Optimizadas para rendimiento

### Chat Interface
- **Input abajo** con textarea expandible
- **Micrófono a la derecha** para activar voz
- **Botón de envío (➤)** junto al micrófono
- **Mensajes arriba** estilo chat conversacional
- **Loading animado** mientras procesa con IA

---

## 📊 API Endpoints

### Gemini AI
```http
POST /api/gemini/parse
Content-Type: application/json

{
  "userInput": "Ayer gasté 2500 pesos en un helado"
}
```

### Transacciones
```http
# Crear transacción
POST /api/transactions
Content-Type: application/json

# Listar transacciones
GET /api/transactions

# Obtener una transacción
GET /api/transactions/:id

# Actualizar transacción
PATCH /api/transactions/:id

# Eliminar transacción
DELETE /api/transactions/:id

# Exportar SQL backup
GET /api/transactions/export/sql
```

---

## 🐳 Docker

### Servicios

**PostgreSQL** (puerto 5432)
- Base de datos de transacciones
- Volumen persistente

**Backend** (puerto 3000)
- API REST con NestJS
- Conecta a PostgreSQL y Gemini

**Frontend** (puerto 80)
- Angular + Nginx
- Reverse proxy a backend

### Comandos Útiles

```bash
# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend

# Reiniciar servicios
docker-compose restart

# Detener todo
docker-compose down

# Reconstruir y reiniciar
docker-compose build --no-cache
docker-compose up -d

# Limpiar todo (incluyendo volúmenes)
docker-compose down -v
```

---

## 🔐 Seguridad

- ✅ API Key de Gemini se pasa como variable de entorno
- ✅ Frontend NUNCA tiene acceso directo a la API key
- ✅ Backend maneja todas las llamadas a Gemini
- ✅ CORS configurado correctamente
- ✅ Validación de inputs con class-validator
- ✅ `.env` en `.gitignore`

---

## 🐛 Solución de Problemas

### Error 400 Bad Request

**Causa**: Backend no está corriendo o API Key incorrecta

**Solución**:
```bash
# Verificar contenedores
docker-compose ps

# Ver logs del backend
docker-compose logs backend

# Verificar API Key
docker exec gestapp-backend env | grep GEMINI_API_KEY
```

### Particles.js no funciona

**Causa**: Librería no se cargó

**Solución**:
```bash
cd frontend
npm install
docker-compose build frontend --no-cache
docker-compose up -d frontend
```

### Reconocimiento de voz no funciona

**Causa**: Navegador incompatible o permisos

**Solución**:
- Usa Chrome o Edge
- Permite acceso al micrófono
- Verifica permisos en: `chrome://settings/content/microphone`

---

## 📚 Documentación Completa

- [INSTALACION_DOCKER.md](./INSTALACION_DOCKER.md) - Guía detallada de Docker
- [frontend/INSTRUCCIONES.md](./frontend/INSTRUCCIONES.md) - Guía del frontend
- API Docs: http://localhost/api/docs (cuando Docker está corriendo)

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Categorías y Descripciones

### Necesidad
- Alimentación necesaria, Aseo, Medicina, Vivienda, Servicios, Transporte, etc.

### Lujo
- Comida rica, Actividades recreativas, Dispositivos, Regalos, Membresías, etc.

### Ahorro
- Valor ahorrado

### Entrada
- Salario, Dinero extra, Rendimientos

---

## 📞 Soporte

Si encuentras algún problema:
1. Revisa [INSTALACION_DOCKER.md](./INSTALACION_DOCKER.md)
2. Revisa los logs: `docker-compose logs -f`
3. Verifica la consola del navegador (F12)
4. Abre un issue en GitHub

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 🎉 Créditos

- **Gemini AI** - Google Generative AI
- **Particles.js** - Vincent Garreau
- **NestJS** - Kamil Myśliwiec
- **Angular** - Google

---

## 🚀 Roadmap

- [ ] Gráficos y estadísticas
- [ ] Exportar a Excel/PDF
- [ ] Filtros avanzados
- [ ] Categorías personalizables
- [ ] Multi-usuario
- [ ] Notificaciones
- [ ] App móvil nativa

---

**Hecho con ❤️ para gestionar tus finanzas**
