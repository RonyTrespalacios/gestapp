#!/bin/bash

# Crear certificados SSL autofirmados para desarrollo local
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl-cert-key.pem \
  -out ssl-cert.pem \
  -subj "/C=CO/ST=Colombia/L=Bogota/O=GestApp/OU=Dev/CN=localhost"

echo "Certificados SSL generados exitosamente!"

