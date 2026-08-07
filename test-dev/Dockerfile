# Stage 1: Build the React Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the Node Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./

# Stage 2: Production Image (Ubuntu)
FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install prerequisites, Node.js, Nginx, and PostgreSQL
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    nginx \
    postgresql postgresql-contrib \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configure PostgreSQL Database
USER postgres
RUN /etc/init.d/postgresql start && \
    psql --command "CREATE USER webhook_user WITH SUPERUSER PASSWORD 'webhook_pass';" && \
    createdb -O webhook_user webhook_db && \
    /etc/init.d/postgresql stop
USER root

# Install PM2 globally
RUN npm install -g pm2

# Copy frontend build to Nginx serving directory
COPY --from=client-builder /app/client/dist /app/client/dist

# Copy backend files and modules
COPY --from=backend-builder /app/server /app/server

# Create a directory for logs and make it writable
RUN mkdir -p /logs && chown -R root:root /logs

# Copy PM2 config
COPY test-dev/pm2.config.js /app/pm2.config.js

# Copy startup script
COPY test-dev/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Copy Nginx config
COPY test-dev/nginx.conf /etc/nginx/sites-available/default

# Expose Nginx port
EXPOSE 80

# Default environment variables
ENV LOG_PATH=/logs/logs.txt
ENV PORT=3000

# Run the startup script (which launches Nginx and PM2)
CMD ["/app/start.sh"]
