# 🎯 GUÍA DE INICIO RÁPIDO - GestApp

## 📋 ¿Qué se ha creado?

Tu aplicación **GestApp** está completamente lista y contiene:

### Backend (NestJS + TypeScript)
- ✅ API REST completa con validaciones
- ✅ Integración con PostgreSQL usando TypeORM
- ✅ Módulo de transacciones (CRUD completo)
- ✅ Módulo de IA con Gemini 2.0 Flash
- ✅ Exportación de backups en SQL
- ✅ Documentación Swagger automática
- ✅ CORS configurado para producción

### Frontend (Angular 17)
- ✅ Diseño moderno y responsive
- ✅ Dos modos: Manual e IA
- ✅ Speech-to-text integrado
- ✅ Formularios con validación
- ✅ Animaciones y feedback visual
- ✅ Compatible con móviles

### Infraestructura (Docker)
- ✅ PostgreSQL 15
- ✅ Nginx como proxy
- ✅ Docker Compose orquestado
- ✅ Sin conflictos de versiones

---

## 🚀 CÓMO INICIAR (3 pasos)

### PASO 1: Obtener API Key de Gemini

```bash
# 1. Ve a: https://makersuite.google.com/app/apikey
# 2. Inicia sesión con tu cuenta Google
# 3. Crea una nueva API key
# 4. Copia la key
```

### PASO 2: Configurar la API Key

```bash
# Edita el archivo .env
nano .env

# Reemplaza "tu_api_key_aqui" con tu API key real
# Guarda: Ctrl + O, Enter
# Sale: Ctrl + X
```

### PASO 3: Desplegar

```bash
# Opción A - Script automático (recomendado)
./start.sh

# Opción B - Manual
docker compose up -d --build
```

---

## 🌐 URLs de Acceso

Una vez desplegado, accede a:

```
Frontend (Usuario):     http://TU_IP_DROPLET
Backend API:            http://TU_IP_DROPLET:3000
Documentación Swagger:  http://TU_IP_DROPLET:3000/api/docs
```

Para saber tu IP:
```bash
curl ifconfig.me
# O
hostname -I | awk '{print $1}'
```

---

## 📱 CÓMO USAR LA APLICACIÓN

### Modo Manual
1. Abre el navegador y ve a tu IP
2. Selecciona categoría (Necesidad, Lujo, Ahorro, Entrada)
3. Elige descripción o escríbela
4. Usa el 🎤 para dictar (opcional)
5. Completa: tipo, monto, medio de pago, fecha
6. Presiona "💾 Guardar"

### Modo IA con Gemini 🤖
1. Cambia al modo "IA con Gemini"
2. Presiona el micrófono grande
3. Di en español:
   - "Ayer gasté 2500 pesos en un helado"
   - "Hoy recibí mi salario de 3500000"
   - "Gasté 15000 en gasolina con Nequi"
4. Verifica los datos auto-completados
5. Presiona "✅ Confirmar y Guardar"

### Descargar Backup
- Presiona "📥 Descargar Backup SQL"
- Se descarga un archivo .sql con todas tus transacciones

---

## 🔧 COMANDOS ÚTILES

### Ver estado de los servicios
```bash
docker compose ps
```

### Ver logs en tiempo real
```bash
# Todos los servicios
docker compose logs -f

# Solo backend
docker compose logs -f backend

# Solo frontend
docker compose logs -f frontend

# Solo base de datos
docker compose logs -f postgres
```

### Reiniciar un servicio
```bash
docker compose restart backend
docker compose restart frontend
```

### Detener la aplicación
```bash
docker compose down
```

### Iniciar la aplicación (después de detenerla)
```bash
docker compose up -d
```

### Limpiar TODO (incluye base de datos)
```bash
docker compose down -v
```

### Reconstruir después de cambios
```bash
docker compose up -d --build
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### ❌ "Error: Cannot connect to database"
```bash
# Verifica que PostgreSQL esté corriendo
docker compose ps

# Reinicia la base de datos
docker compose restart postgres

# Espera 10 segundos y reinicia el backend
sleep 10 && docker compose restart backend
```

### ❌ "Frontend shows 502 Bad Gateway"
```bash
# Verifica que el backend esté corriendo
docker compose logs backend

# Reinicia ambos servicios
docker compose restart backend frontend
```

### ❌ "Gemini API error"
```bash
# Verifica tu API key en .env
cat .env

# Si es incorrecta, edítala
nano .env

# Reinicia el backend
docker compose restart backend
```

### ❌ "El micrófono no funciona"
- Usa HTTPS (los navegadores modernos lo requieren para micrófono)
- Verifica permisos del navegador
- Usa Chrome, Edge o Safari (mejor soporte)

---

## 🔐 SEGURIDAD PARA PRODUCCIÓN

### 1. Cambiar credenciales de PostgreSQL
```bash
# Edita docker-compose.yml
nano docker-compose.yml

# Cambia POSTGRES_PASSWORD por algo seguro
```

### 2. Configurar Firewall
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 3. Configurar HTTPS (Opcional pero recomendado)
```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado (reemplaza tu-dominio.com)
sudo certbot --nginx -d tu-dominio.com
```

---

## 📊 ESTRUCTURA DE DATOS

La base de datos guarda cada transacción con:

- **ID**: Único (UUID)
- **Categoría**: Necesidad | Lujo | Ahorro | Entrada
- **Descripción**: Texto libre o predefinido
- **Tipo**: Ingreso | Egreso | Ahorro
- **Monto**: En pesos colombianos (COP)
- **Medio**: Efectivo, NU, Daviplata, Nequi, BBVA, Bancolombia, etc.
- **Fecha**: Cualquier fecha
- **Observaciones**: Opcional
- **Valor**: Calculado automáticamente (negativo si es egreso)

---

## 📞 ENDPOINTS DE LA API

### Transacciones
```
GET    /transactions          - Listar todas
POST   /transactions          - Crear nueva
GET    /transactions/:id      - Obtener una
PATCH  /transactions/:id      - Actualizar
DELETE /transactions/:id      - Eliminar
GET    /transactions/export/sql - Descargar backup
```

### Gemini IA
```
POST   /gemini/parse          - Procesar texto con IA
```

### Ejemplo de uso de la API:
```bash
# Crear transacción
curl -X POST http://TU_IP:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "categoria": "Lujo",
    "descripcion": "Comida rica",
    "tipo": "Egreso",
    "monto": 25000,
    "medio": "Nequi",
    "fecha": "2025-11-10"
  }'

# Parsear con IA
curl -X POST http://TU_IP:3000/gemini/parse \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Ayer gasté 2500 pesos en un helado"
  }'
```

---

## 🎨 CARACTERÍSTICAS DE LA UI

- ✅ Diseño moderno con gradientes
- ✅ Animaciones suaves
- ✅ Responsive (móvil, tablet, desktop)
- ✅ Feedback visual inmediato
- ✅ Mensajes de éxito/error
- ✅ Loading states
- ✅ Iconos intuitivos
- ✅ Accesible

---

## 🌍 ACCESO DESDE OTROS DISPOSITIVOS

Puedes acceder desde:
- ✅ Tu computadora: `http://IP_DROPLET`
- ✅ Tu celular: `http://IP_DROPLET`
- ✅ Tablet: `http://IP_DROPLET`
- ✅ Cualquier dispositivo en internet con la IP pública

---

## 📈 SIGUIENTES PASOS (Opcional)

1. **Agregar autenticación** (JWT con NestJS)
2. **Dashboard con gráficos** (Chart.js o D3.js)
3. **Notificaciones push**
4. **Filtros y búsqueda avanzada**
5. **Exportar a Excel/CSV**
6. **Límites de presupuesto**
7. **Multi-moneda**

---

## ✅ CHECKLIST DE DESPLIEGUE

- [ ] API Key de Gemini configurada en .env
- [ ] Docker compose corriendo (`docker compose ps`)
- [ ] Frontend accesible en el navegador
- [ ] Backend respondiendo en puerto 3000
- [ ] Base de datos conectada
- [ ] Swagger docs disponible
- [ ] Micrófono funcionando (prueba con HTTPS si es necesario)
- [ ] Backup descargable

---

**¡Tu aplicación está lista! 🎉**

¿Problemas? Revisa los logs: `docker compose logs -f`
