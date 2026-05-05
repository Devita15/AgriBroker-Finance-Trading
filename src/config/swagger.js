// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Farm ERP API',
      version: '2.0.0',
      description: 'Complete Farm ERP System API Documentation',
      contact: {
        name: 'Farm ERP Team',
        email: 'support@farmerp.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Development server (no /api prefix)',
      },
      {
        url: process.env.API_URL || 'http://localhost:5001',
        description: 'Current server',
      }
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
    security: [{ bearerAuth: [] }],
  },
  // Make sure your route files have the correct paths with /api prefix
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);