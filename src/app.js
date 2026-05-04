const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Disable helmet completely for development - it blocks Swagger UI resources
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  originAgentCluster: false,
}));

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests' },
});
app.use('/api', limiter);

// ===== SWAGGER SETUP - STATIC FILES FIRST =====
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Farm ERP API',
      version: '2.0.0',
      description: 'Farm ERP System API Documentation',
    },
    servers: [
      {
        url: '/api',
        description: 'Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

// Swagger UI - serve files properly
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Farm ERP API",
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
  },
  customfavIcon: false,
}));

// Serve swagger spec as JSON
app.get('/api-docs.json', (req, res) => {
  // Update server URL dynamically
  const spec = { ...swaggerSpec };
  spec.servers = [
    {
      url: `${req.protocol}://${req.get('host')}/api`,
      description: 'Current Server',
    },
  ];
  res.json(spec);
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/farmers', require('./routes/farmerRoutes'));
app.use('/api/ledger', require('./routes/ledgerRoutes'));
app.use('/api/audit-logs', require('./routes/auditRoutes'));

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;