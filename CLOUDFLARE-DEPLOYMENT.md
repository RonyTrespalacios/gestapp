# 🚀 Deployment con Cloudflare - Guía Paso a Paso

Esta es la forma **más rápida y económica** de desplegar GestApp en producción con HTTPS válido.

## ⏱️ Tiempo Total: ~30 minutos
## 💰 Costo: ~$12/año (solo el dominio)

---

## 📋 Requisitos Previos

- Servidor con Docker instalado (VPS recomendado: DigitalOcean, AWS, etc.)
- Tarjeta de crédito/débito para comprar dominio

---

## Paso 1: Comprar Dominio (5 min)

### Opciones recomendadas:
- **Namecheap**: https://www.namecheap.com (~$9-12/año)
- **GoDaddy**: https://www.godaddy.com (~$12-15/año)
- **Google Domains**: https://domains.google (~$12/año)

**Ejemplo**: Comprar `gestapp.com` o `migestapp.com`

---

## Paso 2: Configurar Cloudflare (10 min)

### 2.1 Crear cuenta Cloudflare
1. Ir a https://www.cloudflare.com
2. Click en "Sign Up" (es GRATIS)
3. Completar registro

### 2.2 Agregar tu dominio
1. Dashboard → Click en "Add a Site"
2. Ingresar tu dominio: `gestapp.com`
3. Seleccionar plan "Free" (es suficiente)
4. Click "Continue"

### 2.3 Configurar DNS
Cloudflare escaneará tus registros DNS actuales. Ahora debes:

1. **Agregar registro A**:
   ```
   Tipo: A
   Nombre: @
   IPv4: [IP de tu servidor VPS]
   TTL: Auto
   Proxy status: ✅ Proxied (naranja) ← IMPORTANTE
   ```

2. **Agregar registro A para www** (opcional):
   ```
   Tipo: A
   Nombre: www
   IPv4: [IP de tu servidor VPS]
   TTL: Auto
   Proxy status: ✅ Proxied (naranja)
   ```

### 2.4 Cambiar Nameservers
1. Cloudflare te mostrará 2 nameservers, ejemplo:
   ```
   ada.ns.cloudflare.com
   noel.ns.cloudflare.com
   ```

2. Ve al panel de tu proveedor de dominio (Namecheap/GoDaddy)

3. Busca "Nameservers" o "DNS Settings"

4. Cambia de "Default" a "Custom Nameservers"

5. Pega los nameservers de Cloudflare

6. Guardar cambios

7. Volver a Cloudflare y click "Done, check nameservers"

**⏰ Espera**: 5-60 minutos para que se propaguen los cambios

### 2.5 Configurar SSL/TLS
1. En Cloudflare Dashboard → SSL/TLS
2. Seleccionar modo: **"Flexible"**
3. ✅ Listo - Cloudflare ya maneja todo el SSL

---

## Paso 3: Preparar Servidor (10 min)

### 3.1 Conectar al servidor
```bash
ssh root@tu-servidor-ip
```

### 3.2 Instalar Docker (si no está instalado)
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verificar instalación
docker --version
docker compose version
```

### 3.3 Clonar repositorio
```bash
git clone https://github.com/tu-usuario/gestapp.git
cd gestapp
```

### 3.4 Configurar variables de entorno
```bash
# Crear archivo .env
nano .env
```

Contenido del `.env`:
```env
# Gemini API (obligatorio)
GEMINI_API_KEY=tu_gemini_api_key

# JWT Secret (cambiar por algo seguro)
JWT_SECRET=genera-un-string-aleatorio-muy-largo-y-seguro-aqui

# Email (opcional pero recomendado para producción)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password_de_gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Frontend URL (tu dominio)
FRONTEND_URL=https://gestapp.com
```

**Para generar JWT_SECRET seguro:**
```bash
openssl rand -base64 32
```

### 3.5 Configurar Email con Gmail (Opcional)
1. Ir a https://myaccount.google.com/security
2. Activar "Verificación en 2 pasos"
3. Ir a "Contraseñas de aplicaciones"
4. Crear una para "Mail"
5. Copiar la contraseña generada a `EMAIL_PASS`

---

## Paso 4: Desplegar (5 min)

```bash
# Construir y levantar servicios
docker compose up -d --build

# Ver logs (verificar que todo esté OK)
docker compose logs -f

# Si todo está bien, presiona Ctrl+C para salir
```

### Verificar servicios:
```bash
docker compose ps
```

Deberías ver:
- ✅ gestapp-db (running)
- ✅ gestapp-backend (running)
- ✅ gestapp-frontend (running)

---

## Paso 5: Probar (2 min)

1. Abre tu navegador
2. Visita: `https://gestapp.com` (tu dominio)
3. Verifica:
   - ✅ Aparece tu aplicación
   - ✅ Candado verde 🔒 en la barra de direcciones
   - ✅ Sin advertencias de seguridad

**¡Listo!** Tu aplicación está en producción con HTTPS válido 🎉

---

## 🔧 Comandos Útiles

### Ver logs en tiempo real:
```bash
docker compose logs -f
```

### Ver logs del backend:
```bash
docker compose logs -f backend
```

### Reiniciar servicios:
```bash
docker compose restart
```

### Actualizar código:
```bash
git pull
docker compose up -d --build
```

### Parar servicios:
```bash
docker compose down
```

---

## 🐛 Troubleshooting

### DNS no resuelve
```bash
# Verificar propagación DNS
nslookup gestapp.com
# O visitar: https://dnschecker.org
```
**Solución**: Esperar más tiempo (hasta 48 horas máximo)

### "Cannot connect to backend"
```bash
# Verificar backend esté corriendo
docker compose logs backend

# Verificar puerto abierto
curl http://localhost:3000/api/transactions
```

### Email no funciona
- Verificar credentials en `.env`
- Verificar "Contraseña de aplicación" en Gmail
- Ver logs: `docker compose logs backend | grep email`

### Cloudflare muestra "Error 521"
- Backend no está corriendo
- Puerto 80 bloqueado por firewall
- Ejecutar: `docker compose up -d`

---

## 🔒 Seguridad en Producción

### Firewall (Recomendado):
```bash
# UFW (Ubuntu)
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS (Cloudflare lo redirige)
ufw enable
```

### Actualizaciones:
```bash
# Actualizar sistema
apt update && apt upgrade -y

# Actualizar Docker images
docker compose pull
docker compose up -d
```

---

## 📈 Escalabilidad

### Para más tráfico:
1. Aumentar recursos del VPS
2. Usar PostgreSQL externo (AWS RDS, etc.)
3. Usar Redis para sesiones
4. Cloudflare CDN ya está activo (gratis)

### Backup automático:
```bash
# Backup de base de datos
docker compose exec postgres pg_dump -U gestapp_user gestapp > backup.sql

# Crear script de backup diario
crontab -e
# Agregar:
0 2 * * * cd /root/gestapp && docker compose exec postgres pg_dump -U gestapp_user gestapp > backup_$(date +\%Y\%m\%d).sql
```

---

## 💡 Ventajas de esta Config

✅ **SSL Gratis**: Cloudflare maneja certificados  
✅ **CDN Gratis**: Cloudflare acelera tu sitio globalmente  
✅ **DDoS Protection**: Cloudflare protege contra ataques  
✅ **Analytics**: Dashboard con estadísticas de tráfico  
✅ **Auto-renovación**: Certificados se renuevan solos  
✅ **Costo mínimo**: Solo ~$12/año por el dominio  

---

## 📞 Soporte

Si tienes problemas:
1. Revisar logs: `docker compose logs`
2. Verificar DNS: https://dnschecker.org
3. Verificar Cloudflare: Dashboard → Analytics
4. Revisar SETUP.md para más detalles

---

**¡Tu GestApp ya está en producción! 🚀**

