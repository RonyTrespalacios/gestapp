FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine

# Instalar OpenSSL para generar certificados
RUN apk add --no-cache openssl

# Generar certificados SSL autofirmados
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/ssl-cert-key.pem \
    -out /etc/nginx/ssl/ssl-cert.pem \
    -subj "/C=CO/ST=Colombia/L=Bogota/O=GestApp/OU=Dev/CN=localhost"

COPY --from=builder /app/dist/gestapp-frontend/browser /usr/share/nginx/html
COPY nginx-ssl.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
