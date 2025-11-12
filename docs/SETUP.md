# 🚀 Guía de Despliegue

## 1. Deploy Backend con Docker y Frontend Local

<details>
  <summary>Desplegar Backend con Docker y Frontend local</summary>

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/RonyTrespalacios/gestapp.git
cd gestapp
```

### Paso 2: Instalar Docker (si no lo tienes)

<details>
  <summary>Si no tienes Docker, instalar Docker</summary>

#### Windows

1. Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop
2. Ejecuta el instalador y sigue las instrucciones
3. Reinicia tu computadora si es necesario
4. Abre Docker Desktop y espera a que inicie completamente
5. Verifica la instalación:
```bash
docker --version
docker-compose --version
```

#### Ubuntu

Actualizar paquetes:

```bash
sudo apt update
```

Instalar dependencias:

```bash
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
```

Agregar clave GPG oficial de Docker:

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

Agregar repositorio de Docker:

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

Instalar Docker:

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

Agregar tu usuario al grupo docker (para no usar sudo):

```bash
sudo usermod -aG docker $USER
```

Reiniciar sesión o ejecutar:

```bash
newgrp docker
```

Verificar instalación:

```bash
docker --version
docker compose version
```

</details>

### Paso 3: Configurar variables de entorno

Antes de crear el archivo `.env`, necesitas obtener las siguientes credenciales:

#### Obtener GEMINI_API_KEY

1. Visita: https://makersuite.google.com/app/apikey
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key" o "Get API Key"
4. Copia la API key generada

#### Obtener JWT_SECRET

El `JWT_SECRET` es una cadena aleatoria que se usa para firmar los tokens JWT. Puedes generar uno de las siguientes formas:

**Opción 1: Generar con OpenSSL (recomendado)**

```bash
openssl rand -base64 32
```

**Opción 2: Generar con Node.js**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Opción 3: Usar cualquier cadena aleatoria segura**

Puedes usar cualquier cadena de texto aleatoria y segura (mínimo 32 caracteres). Por ejemplo, puedes usar un generador de contraseñas.

#### Crear el archivo `.env`

Una vez que tengas ambos valores, crea el archivo `.env` en la raíz del proyecto:

**Windows (PowerShell):**

```bash
echo "GEMINI_API_KEY=tu_api_key_aqui" > .env
echo "JWT_SECRET=tu_jwt_secret_aqui" >> .env
```

**Ubuntu/Linux:**

```bash
cat > .env << EOF
GEMINI_API_KEY=tu_api_key_aqui
JWT_SECRET=tu_jwt_secret_aqui
EOF
```

Reemplaza `tu_api_key_aqui` y `tu_jwt_secret_aqui` con los valores reales que obtuviste.

#### Configurar envío de correos con Gmail (Opcional)

Si quieres que los correos de verificación se envíen automáticamente, configura las credenciales de Gmail. **Nota importante**: Si configuras el correo, también debes configurar `FRONTEND_URL` para que los enlaces de verificación funcionen correctamente.

**Paso 1: Obtener App Password de Gmail**

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Activa la verificación en dos pasos si no la tienes activada
3. Ve a "Seguridad" → "Contraseñas de aplicaciones"
4. Selecciona "Correo" y "Otro (nombre personalizado)"
5. Escribe "GestApp" y haz clic en "Generar"
6. Copia la contraseña de 16 caracteres generada (esta es tu `EMAIL_PASS`)

**Paso 2: Agregar credenciales al archivo `.env`**

**Windows (PowerShell):**

```bash
echo "EMAIL_USER=tu_email@gmail.com" >> .env
echo "EMAIL_PASS=tu_app_password_de_16_caracteres" >> .env
echo "EMAIL_HOST=smtp.gmail.com" >> .env
echo "EMAIL_PORT=587" >> .env
echo "FRONTEND_URL=http://localhost:4200" >> .env
```

**Ubuntu/Linux:**

```bash
cat >> .env << EOF
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password_de_16_caracteres
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
FRONTEND_URL=http://localhost:4200
EOF
```

**Explicación de las variables:**
- `EMAIL_USER`: Tu dirección de correo de Gmail
- `EMAIL_PASS`: La App Password de 16 caracteres generada
- `EMAIL_HOST`: Servidor SMTP (por defecto `smtp.gmail.com`, pero se recomienda configurarlo explícitamente)
- `EMAIL_PORT`: Puerto SMTP (por defecto `587`, pero se recomienda configurarlo explícitamente)
- `FRONTEND_URL`: **Requerido si configuras correo**. Debe ser la URL donde está corriendo tu frontend. Para frontend local usa `http://localhost:4200`

**Si no configuras el correo**: Los tokens de verificación se mostrarán en los logs del backend. Verás cómo acceder a ellos después de desplegar el frontend (Paso 6).

### Paso 4: Levantar el Backend con Docker

En la raíz del proyecto:

```bash
docker compose -f docker-compose-backend.yml up --build
```

O en modo detached (en segundo plano):

```bash
docker compose -f docker-compose-backend.yml up -d --build
```

El backend estará disponible en: `http://localhost:3000/api`

### Paso 5: Desplegar Frontend Localmente

#### Windows

**Opción 1: Modo desarrollo (terminal abierta)**
```bash
cd frontend
npm install
npm start
```
El frontend estará en: `http://localhost:4200`
Para detener: Presiona `Ctrl + C` en la terminal

**Opción 2: Modo desarrollo en segundo plano (sin terminal abierta)**
```powershell
cd frontend
npm install
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"
```
Para detener: Cierra la ventana de PowerShell o ejecuta:
```powershell
Get-Process node | Where-Object {$_.Path -like "*frontend*"} | Stop-Process
```

**Opción 3: Build de producción y servir con servidor local**

```bash
cd frontend
npm install
npm run build
```

Luego puedes usar cualquier servidor HTTP estático. Por ejemplo, con Python:

```bash
cd dist/gestapp-frontend
python -m http.server 4200
```

#### Ubuntu

**Opción 1: Modo desarrollo (terminal abierta)**
```bash
cd frontend
npm install
npm start
```
El frontend estará en: `http://localhost:4200`
Para detener: Presiona `Ctrl + C` en la terminal

**Opción 2: Modo desarrollo en segundo plano (sin terminal abierta)**
```bash
cd frontend
npm install
nohup npm start > frontend.log 2>&1 &
echo $! > frontend.pid
```
El frontend estará en: `http://localhost:4200`
Para detener:
```bash
kill $(cat frontend/frontend.pid)
rm frontend/frontend.pid
```

**Opción 3: Build de producción y servir con servidor local**

```bash
cd frontend
npm install
npm run build
```

Luego puedes usar cualquier servidor HTTP estático. Por ejemplo, con Python:

```bash
cd dist/gestapp-frontend
python3 -m http.server 4200
```

### Paso 6: Ver tokens de verificación (si no configuraste correo)

Si no configuraste el envío de correos, los tokens de verificación se mostrarán en los logs del backend. Para verlos:

**Si usas Docker:**

Ver solo logs de verificación de emails:

```bash
docker compose -f docker-compose-backend.yml logs -f backend | grep -E "DEV MODE|Verification URL"
```

O ver todos los logs del backend:

```bash
docker compose -f docker-compose-backend.yml logs -f backend
```

Busca líneas que digan `[DEV MODE] Verification email for` y `Verification URL:` para ver el token completo y la URL de verificación.

**Si desarrollas localmente sin Docker:**

Los logs aparecerán directamente en la terminal donde ejecutaste `npm run start:dev` en el backend. Busca líneas que digan `[DEV MODE] Verification email for` y `Verification URL:` para ver el token completo.

### Paso 7: Detener los contenedores de Docker

Detener y eliminar contenedores:

```bash
docker compose -f docker-compose-backend.yml down
```

O solo detener (sin eliminar):

```bash
docker compose -f docker-compose-backend.yml stop
```

**Nota**: Recuerda también detener el frontend si lo tienes corriendo localmente (presiona `Ctrl + C` en la terminal donde está corriendo, o usa los comandos de detención según la opción que elegiste).

</details>

---

## 2. Deploy Completo con Docker

<details>
  <summary>Desplegar todo con Docker (Backend + Frontend)</summary>

### Paso 1: Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd gestapp
```

### Paso 2: Configurar variables de entorno

Antes de crear el archivo `.env`, necesitas obtener las siguientes credenciales:

#### Obtener GEMINI_API_KEY

1. Visita: https://makersuite.google.com/app/apikey
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key" o "Get API Key"
4. Copia la API key generada

#### Obtener JWT_SECRET

El `JWT_SECRET` es una cadena aleatoria que se usa para firmar los tokens JWT. Puedes generar uno de las siguientes formas:

**Opción 1: Generar con OpenSSL (recomendado)**

```bash
openssl rand -base64 32
```

**Opción 2: Generar con Node.js**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Opción 3: Usar cualquier cadena aleatoria segura**

Puedes usar cualquier cadena de texto aleatoria y segura (mínimo 32 caracteres). Por ejemplo, puedes usar un generador de contraseñas.

#### Crear el archivo `.env`

Una vez que tengas ambos valores, crea el archivo `.env` en la raíz del proyecto:

**Windows (PowerShell):**

```bash
echo "GEMINI_API_KEY=tu_api_key_aqui" > .env
echo "JWT_SECRET=tu_jwt_secret_aqui" >> .env
```

**Ubuntu/Linux:**

```bash
cat > .env << EOF
GEMINI_API_KEY=tu_api_key_aqui
JWT_SECRET=tu_jwt_secret_aqui
EOF
```

Reemplaza `tu_api_key_aqui` y `tu_jwt_secret_aqui` con los valores reales que obtuviste.

#### Configurar envío de correos con Gmail (Opcional)

Si quieres que los correos de verificación se envíen automáticamente, configura las credenciales de Gmail. **Nota importante**: Si configuras el correo, también debes configurar `FRONTEND_URL` para que los enlaces de verificación funcionen correctamente.

**Paso 1: Obtener App Password de Gmail**

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Activa la verificación en dos pasos si no la tienes activada
3. Ve a "Seguridad" → "Contraseñas de aplicaciones"
4. Selecciona "Correo" y "Otro (nombre personalizado)"
5. Escribe "GestApp" y haz clic en "Generar"
6. Copia la contraseña de 16 caracteres generada (esta es tu `EMAIL_PASS`)

**Paso 2: Agregar credenciales al archivo `.env`**

**Windows (PowerShell):**

```bash
echo "EMAIL_USER=tu_email@gmail.com" >> .env
echo "EMAIL_PASS=tu_app_password_de_16_caracteres" >> .env
echo "EMAIL_HOST=smtp.gmail.com" >> .env
echo "EMAIL_PORT=587" >> .env
echo "FRONTEND_URL=http://localhost" >> .env
```

**Ubuntu/Linux:**

```bash
cat >> .env << EOF
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password_de_16_caracteres
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
FRONTEND_URL=http://localhost
EOF
```

**Explicación de las variables:**
- `EMAIL_USER`: Tu dirección de correo de Gmail
- `EMAIL_PASS`: La App Password de 16 caracteres generada
- `EMAIL_HOST`: Servidor SMTP (por defecto `smtp.gmail.com`, pero se recomienda configurarlo explícitamente)
- `EMAIL_PORT`: Puerto SMTP (por defecto `587`, pero se recomienda configurarlo explícitamente)
- `FRONTEND_URL`: **Requerido si configuras correo**. Debe ser la URL donde está corriendo tu frontend. En despliegue completo con Docker, usa `http://localhost`

**Si no configuras el correo**: Los tokens de verificación se mostrarán en los logs del backend. Verás cómo acceder a ellos después de levantar los servicios (Paso 4).

### Paso 3: Levantar todos los servicios

En la raíz del proyecto:

```bash
docker compose up -d --build
```

Esto levantará:
- **PostgreSQL** en el puerto `5432`
- **Backend** en `http://localhost:3000/api`
- **Frontend** en `http://localhost`

### Paso 4: Ver tokens de verificación (si no configuraste correo)

Si no configuraste el envío de correos, los tokens de verificación se mostrarán en los logs del backend. Para verlos:

**Si usas Docker:**

Ver solo logs de verificación de emails:

```bash
docker compose logs -f backend | grep -E "DEV MODE|Verification URL"
```

O ver todos los logs del backend:

```bash
docker compose logs -f backend
```

Busca líneas que digan `[DEV MODE] Verification email for` y `Verification URL:` para ver el token completo y la URL de verificación.

**Si desarrollas localmente sin Docker:**

Los logs aparecerán directamente en la terminal donde ejecutaste `npm run start:dev` en el backend. Busca líneas que digan `[DEV MODE] Verification email for` y `Verification URL:` para ver el token completo.

### Paso 5: Detener los contenedores

Detener y eliminar contenedores:

```bash
docker compose down
```

O solo detener (sin eliminar):

```bash
docker compose stop
```

**Nota**: Esto detendrá todos los servicios (PostgreSQL, Backend y Frontend).

</details>

---

## 3. Limpieza de Docker

<details>
  <summary>Eliminar cache y residuos de Docker</summary>

Esta sección aplica para cualquiera de los métodos de despliegue anteriores.

### Eliminar cache y residuos de Docker

Eliminar contenedores detenidos, redes no usadas e imágenes huérfanas:

```bash
docker system prune
```

Eliminar todo incluyendo volúmenes (¡CUIDADO! Esto elimina datos persistentes):

```bash
docker system prune -a --volumes
```

**⚠️ Advertencia**: `docker system prune -a --volumes` eliminará todos los volúmenes, incluyendo la base de datos. Úsalo solo si quieres empezar desde cero.

Eliminar solo volúmenes no usados:

```bash
docker volume prune
```

Eliminar imágenes no usadas:

```bash
docker image prune -a
```

Ver espacio liberado:

```bash
docker system df
```

### Limpieza específica del proyecto

Detener y eliminar contenedores del proyecto (despliegue completo):

```bash
docker compose down
```

Detener y eliminar contenedores del proyecto (solo backend):

```bash
docker compose -f docker-compose-backend.yml down
```

Eliminar volúmenes del proyecto (despliegue completo):

```bash
docker compose down -v
```

Eliminar volúmenes del proyecto (solo backend):

```bash
docker compose -f docker-compose-backend.yml down -v
```

Eliminar imágenes del proyecto:

```bash
docker rmi gestapp-backend gestapp-frontend
```

</details>
