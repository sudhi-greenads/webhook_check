#!/bin/bash

# Ensure logs directory exists
mkdir -p /logs

# Start PostgreSQL
echo "Starting PostgreSQL server..."
service postgresql start
sleep 2

# Start Redis if installed
if command -v redis-server > /dev/null 2>&1; then
    echo "Starting Redis server..."
    service redis-server start || redis-server --daemonize yes
fi

# Start Nginx
echo "Testing Nginx configuration..."
nginx -t || { echo "Nginx syntax check failed:"; cat /var/log/nginx/error.log; }

echo "Starting Nginx server..."
service nginx start || { echo "Nginx failed to start! Error log:"; cat /var/log/nginx/error.log; }

# Start PM2 process manager in the foreground to keep the container alive
echo "Starting PM2 Ecosystem (Node API)..."
pm2-runtime start /app/pm2.config.js
