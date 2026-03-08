import type { ControllerDefinition, RouteDefinition, DtoSchema, SchemaMap, EndpointMap } from '@company/api-sync-core';

/**
 * Sample endpoint map for testing — simulates a ToursController
 * with CRUD operations.
 */
export const sampleEndpointMap: ControllerDefinition[] = [
  {
    name: 'ToursController',
    prefix: 'tours',
    filePath: '/app/src/tours.controller.ts',
    routes: [
      {
        method: 'GET',
        path: '/',
        fullPath: '/tours',
        controllerName: 'ToursController',
        methodName: 'findAll',
        parameters: [
          { name: 'page', location: 'query', type: 'string', required: false },
          { name: 'limit', location: 'query', type: 'string', required: false },
        ],
        expectedStatus: 200,
        isAuthenticated: false,
        tags: [],
      },
      {
        method: 'GET',
        path: '/:id',
        fullPath: '/tours/:id',
        controllerName: 'ToursController',
        methodName: 'findOne',
        parameters: [
          { name: 'id', location: 'path', type: 'string', required: true },
        ],
        expectedStatus: 200,
        isAuthenticated: false,
        tags: [],
      },
      {
        method: 'POST',
        path: '/',
        fullPath: '/tours',
        controllerName: 'ToursController',
        methodName: 'create',
        parameters: [],
        bodyType: 'CreateTourDto',
        expectedStatus: 201,
        isAuthenticated: true,
        tags: [],
      },
      {
        method: 'PUT',
        path: '/:id',
        fullPath: '/tours/:id',
        controllerName: 'ToursController',
        methodName: 'update',
        parameters: [
          { name: 'id', location: 'path', type: 'string', required: true },
        ],
        bodyType: 'CreateTourDto',
        expectedStatus: 200,
        isAuthenticated: true,
        tags: [],
      },
      {
        method: 'DELETE',
        path: '/:id',
        fullPath: '/tours/:id',
        controllerName: 'ToursController',
        methodName: 'remove',
        parameters: [
          { name: 'id', location: 'path', type: 'string', required: true },
        ],
        expectedStatus: 204,
        isAuthenticated: false,
        tags: [],
      },
    ],
  },
];

/**
 * Sample schema map for testing — a CreateTourDto with various constraints.
 */
export const sampleSchemaMap: SchemaMap = {
  CreateTourDto: {
    name: 'CreateTourDto',
    filePath: '/app/src/create-tour.dto.ts',
    properties: [
      { name: 'name', type: 'string', required: true, minLength: 3, maxLength: 100 },
      { name: 'price', type: 'number', required: true, min: 0, max: 999999 },
      { name: 'duration', type: 'number', required: true, min: 1 },
      { name: 'category', type: 'enum', required: true, enumValues: ['adventure', 'cultural', 'wildlife'] },
      { name: 'description', type: 'string', required: false },
      { name: 'email', type: 'string', required: false, isEmail: true },
    ],
  },
};
