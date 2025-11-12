#!/bin/bash

# Script de despliegue para GestApp
# Este script te guiará paso a paso en el despliegue

echo "🚀 Iniciando despliegue de GestApp..."
echo ""

# Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

echo "✅ Docker está instalado"
echo ""

# Verificar archivo .env
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado. Creando desde template..."
    cp .env.example .env
    echo "⚠️  IMPORTANTE: Edita el archivo .env y agrega tu GEMINI_API_KEY"
    echo "   Ejecuta: nano .env"
    echo ""
    read -p "Presiona Enter cuando hayas configurado tu API key..."
fi

echo "📦 Construyendo y levantando contenedores..."
echo "   Esto puede tomar varios minutos la primera vez..."
echo ""

docker compose up -d --build

echo ""
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

echo ""
echo "📊 Estado de los contenedores:"
docker compose ps

echo ""
echo "✅ ¡Despliegue completado!"
echo ""
echo "🌐 Accede a la aplicación en:"
echo "   Frontend: http://$(hostname -I | awk '{print $1}')"
echo "   Backend API: http://$(hostname -I | awk '{print $1}'):3000"
echo "   Swagger Docs: http://$(hostname -I | awk '{print $1}'):3000/api/docs"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs: docker compose logs -f"
echo "   Detener: docker compose down"
echo "   Reiniciar: docker compose restart"
echo ""
