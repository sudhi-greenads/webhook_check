// index.js - Express server with PostgreSQL logging
require('dotenv').config(); // Load local .env file
const express = require('express');
const cors = require('cors');
const { initializeDB } = require('./services/registryService');
const { cleanupOldLogs } = require('./utils/cleanup');

async function startServer() {
  try {
    // 1. Wait for database to initialize before doing anything else
    await initializeDB();
    
    // 2. Run initial cleanup and schedule daily
    cleanupOldLogs();
    setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);

    const app = express();

    // 3. Configure CORS with Environment Variables
    const allowedOrigins = [
      process.env.FRONTEND_PUBLIC_URL,
      process.env.FRONTEND_INTERNAL_URL,
      'http://localhost:5173', // Vite dev server
      'http://127.0.0.1:5173',
    ].filter(Boolean); // Remove undefined values

    app.use(cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        // Or if the origin is explicitly allowed
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.length === 0) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    }));

    app.use(express.json());

    // 4. Mount API Routes
    const apiRouter = require('./routes/apiRouter');
    app.use('/api', apiRouter);

    // 5. Catch Webhook Requests
    const requestRouter = require('./routes/requestRouter');
    app.use(requestRouter);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
