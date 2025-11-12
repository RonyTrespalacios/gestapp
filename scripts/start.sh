#!/bin/bash

# Script de inicio rápido - IMPORTANTE: Primero configura tu API key

echo "🔑 PASO 1: Configurar API Key de Gemini"
echo ""
echo "Si aún no tienes una API key:"
echo "1. Ve a https://makersuite.google.com/app/apikey"
echo "2. Inicia sesión con tu cuenta de Google"
echo "3. Crea una nueva API key"
echo ""
echo "Ahora edita el archivo .env:"
nano .env

echo ""
echo "🚀 PASO 2: Iniciar la aplicación"
echo ""
./deploy.sh
