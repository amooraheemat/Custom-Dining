import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Custom Dining API',
      version: '1.0.0',
      description: 'API for Custom Dining application',
    },
    servers: [
      {
        url: 'http://localhost:3006/api',
        description: 'Development server',
      },
    ],
    basePath: '/',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
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
  apis: ['./src/routes/*.js'], // Path to the API routes
};

export const specs = swaggerJsdoc(options);
