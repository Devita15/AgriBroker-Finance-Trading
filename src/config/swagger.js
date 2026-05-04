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
    // No servers defined - will be added dynamically per request
    servers: [],
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
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);