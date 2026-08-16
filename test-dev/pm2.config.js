module.exports = {
  apps: [
    {
      name: "webhook-server",
      script: "/app/server/index.js",
      cwd: "/app/server",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        DATABASE_URL: process.env.DATABASE_URL || "postgresql://webhook_user:webhook_pass@127.0.0.1:5432/webhook_db",
        REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
        IP_LOOKUP_API_URL: process.env.IP_LOOKUP_API_URL || "https://ipstatus.com/api/ip-lookup",
        FRONTEND_PUBLIC_URL: process.env.FRONTEND_PUBLIC_URL || "https://webhook-check-dsad.onrender.com",
        FRONTEND_INTERNAL_URL: process.env.FRONTEND_INTERNAL_URL || "http://localhost:5173",
        BACKEND_PUBLIC_URL: process.env.BACKEND_PUBLIC_URL || "https://webhook-check-dsad.onrender.com/webhook",
        BACKEND_INTERNAL_URL: process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:3000",
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "development_access_secret",
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "development_refresh_secret"
      }
    }
  ]
};
