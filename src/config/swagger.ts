/**
 * Swagger/OpenAPI Configuration
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Operations Management API',
      version: '1.0.0',
      description: 'API RESTful para gestão de operações financeiras, clientes, parcelas e pagamentos',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtido no endpoint /auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Error message',
                },
                code: {
                  type: 'string',
                  example: 'ERROR_CODE',
                },
                details: {
                  type: 'object',
                },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
            },
            limit: {
              type: 'integer',
              example: 20,
            },
            total: {
              type: 'integer',
              example: 100,
            },
            totalPages: {
              type: 'integer',
              example: 5,
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticação e autorização',
      },
      {
        name: 'Accounts',
        description: 'Gestão de contas',
      },
      {
        name: 'Clients',
        description: 'Gestão de clientes',
      },
      {
        name: 'Operations',
        description: 'Gestão de operações financeiras',
      },
      {
        name: 'Installments',
        description: 'Gestão de parcelas',
      },
      {
        name: 'Payments',
        description: 'Gestão de pagamentos',
      },
      {
        name: 'Resources',
        description: 'Gestão de recursos (imóveis, veículos, etc.)',
      },
      {
        name: 'Alerts',
        description: 'Gestão de alertas',
      },
      {
        name: 'Notifications',
        description: 'Gestão de notificações',
      },
      {
        name: 'Settings',
        description: 'Configurações',
      },
      {
        name: 'Platform Users',
        description: 'Gestão de usuários da plataforma',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Paths to files containing OpenAPI definitions
};

export const swaggerSpec = swaggerJsdoc(options);

