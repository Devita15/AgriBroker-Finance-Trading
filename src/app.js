// src/app.js
require('dotenv').config();

const express        = require('express');
const cors           = require('cors');
const helmet         = require('helmet');
const morgan         = require('morgan');
const rateLimit      = require('express-rate-limit');
const swaggerUi      = require('swagger-ui-express');

const connectDB      = require('./config/database');
const swaggerSpec    = require('./config/swagger');
const logger         = require('./config/logger');
const errorHandler   = require('./middleware/errorHandler');

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/authRoutes');
const farmerRoutes    = require('./routes/farmerRoutes');
const purchaseRoutes  = require('./routes/purchaseRoutes');
const paymentRoutes   = require('./routes/paymentRoutes');
const expenseRoutes   = require('./routes/expenseRoutes');
const saleRoutes      = require('./routes/saleRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const reportRoutes    = require('./routes/reportRoutes');
const auditRoutes     = require('./routes/auditRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security & Request Middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      200,
  message:  { success: false, error: 'Too many requests, please try again later.' },
}));

// Stricter limit for auth endpoints
app.use('/api/auth/login',    rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, error: 'Too many login attempts.' } }));
app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { success: false, error: 'Too many registration attempts.' } }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logger (skip in test env)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ── Swagger Docs ───────────────────────────────────────────────────────────────
// Support both /api/docs and /api-docs for compatibility
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Farm ERP API Docs',
  swaggerOptions:  { persistAuthorization: true },
}));

// Also support /api-docs (without the slash) for the console output
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Farm ERP API Docs',
  swaggerOptions:  { persistAuthorization: true },
}));

// Redirect root to API docs (optional)
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    env:       process.env.NODE_ENV,
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/farmers',   farmerRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/expenses',  expenseRoutes);
app.use('/api/sales',     saleRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports',   reportRoutes);
app.use('/api/audit',     auditRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;