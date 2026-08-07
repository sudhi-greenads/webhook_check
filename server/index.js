// index.js - Express server with PostgreSQL logging
require('dotenv').config(); // Load local .env file
const express = require('express');
const cors = require('cors');
const { initializeDB } = require('./services/registryService');
const { cleanupOldLogs } = require('./utils/cleanup');
const loggerMiddleware = require('./utils/loggerMiddleware');

async function startServer() {
  try {
    // 1. Wait for database to initialize before doing anything else
    await initializeDB();
    
    // 2. Run initial cleanup and schedule daily
    cleanupOldLogs();
    setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);

    const app = express();

    // 3. Configure CORS to allow all origins
    app.use(cors());

    app.use(express.json());

    // 3.5 Global Request Logger
    app.use(loggerMiddleware);

    // 4. Mount API Routes
    const authRouter = require('./routes/authRouter');
    const apiRouter = require('./routes/apiRouter');
    app.use('/auth', authRouter);
    app.use('/', apiRouter);

    // 5. Catch Webhook Requests
    const requestRouter = require('./routes/requestRouter');
    app.use('/webhook', requestRouter);

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
