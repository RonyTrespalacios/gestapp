#!/bin/bash

# Script de prueba para la API de Gemini

echo "Probando API de Gemini..."
echo ""

curl -X POST http://localhost:3000/api/gemini/parse \
  -H "Content-Type: application/json" \
  -d '{"userInput": "ayer gasté 2500 en un helado"}' \
  | jq .

echo ""
echo "Si ves un JSON con categoria, descripcion, tipo, monto, medio, fecha - todo está bien!"

