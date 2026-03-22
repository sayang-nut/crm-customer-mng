'use strict';

require('dotenv').config();
require('express-async-errors');          // Bắt async error tự động, không cần try/catch

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const compression  = require('compression');
const rateLimit    = require('express-rate-limit');

const sequelize    = require('./config/database');
const logger       = require('./config/logger');
const { errorHandler } = require('./middleware/error.middleware');

// ── Route imports ─────────────────────────────────────────────────
const authRoutes          = require('./modules/auth/auth.routes');
const usersRoutes         = require('./modules/users/users.routes');
const customersRoutes     = require('./modules/customers/customers.routes');
const solutionsRoutes     = require('./modules/solutions/solutions.routes');
const contractsRoutes     = require('./modules/contracts/contracts.routes');
const ticketsRoutes       = require('./modules/tickets/tickets.routes');
const revenuesRoutes      = require('./modules/revenues/revenues.routes');
const dashboardRoutes     = require('./modules/dashboard/dashboard.routes');

const notificationsRoutes = require('./modules/notifications/notifications.routes');

console.log('✅ Dashboard routes loaded:', dashboardRoutes);

const app = express();

// ── Security headers ──────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────
app.use(cors({
  origin: (process.env.FRONTEND_URL || 'http://localhost:5173').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Compression ───────────────────────────────────────────────────
app.use(compression());

// ── Request logging ───────────────────────────────────────────────
app.use(morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  { stream: { write: (msg) => logger.info(msg.trim()) } }
));

// ── Body parsers ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate limiters ─────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 1000, // ← dev = không giới hạn thực tế
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.' },
  skip: (req) => process.env.NODE_ENV !== 'production', // ← SKIP hoàn toàn khi dev
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
  skip: (req) => process.env.NODE_ENV !== 'production', // ← SKIP hoàn toàn khi dev
});

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/users',         apiLimiter,  usersRoutes);
app.use('/api/customers',     apiLimiter,  customersRoutes);
app.use('/api/solutions',     apiLimiter,  solutionsRoutes);
app.use('/api/contracts',     apiLimiter,  contractsRoutes);
app.use('/api/tickets',       apiLimiter,  ticketsRoutes);
app.use('/api/revenues',      apiLimiter,  revenuesRoutes);
app.use('/api/dashboard',     apiLimiter,  dashboardRoutes);
app.use('/api/notifications', apiLimiter,  notificationsRoutes);

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    service:   'bado-crm-api',
    version:   process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development',
  });
});

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route không tồn tại: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global error handler (phải đặt cuối cùng) ────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 3000;

const start = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connected successfully.');

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Bado CRM API running on port ${PORT}`);
      logger.info(`   ENV : ${process.env.NODE_ENV || 'development'}`);
      logger.info(`   URL : http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      logger.info(`Received ${signal}. Graceful shutdown...`);
      server.close(async () => {
        await sequelize.close();
        logger.info('Server closed.');
        process.exit(0);
      });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    // Chạy cron jobs sau khi server lên
    if (process.env.NODE_ENV !== 'test') {
      const { startCronJobs } = require('./utils/cron');
      startCronJobs();
    }

  } catch (err) {
    logger.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

// Chỉ khởi động nếu chạy trực tiếp (không phải require trong test)
if (require.main === module) {
  start();
}

module.exports = app;