import type { OpenAPIV3 } from 'openapi-types';
import { PathBuilder } from '../../src/builder/PathBuilder';
import { sampleEndpointMap, sampleSchemaMap } from '../fixtures/sample-endpoint-map';

describe('PathBuilder', () => {
  let builder: PathBuilder;

  beforeAll(() => {
    builder = new PathBuilder();
  });

  describe('buildPaths', () => {
    it('should produce /tours path item', () => {
      const paths = builder.buildPaths(sampleEndpointMap, sampleSchemaMap);
      expect(paths).toHaveProperty('/tours');
    });

    it('should convert :id path param to {id}', () => {
      const paths = builder.buildPaths(sampleEndpointMap, sampleSchemaMap);
      expect(paths).toHaveProperty('/tours/{id}');
      expect(paths).not.toHaveProperty('/tours/:id');
    });

    it('should produce GET operation for /tours', () => {
      const paths = builder.buildPaths(sampleEndpointMap, sampleSchemaMap);
      const toursPath = paths['/tours'] as OpenAPIV3.PathItemObject;
      expect(toursPath.get).toBeDefined();
      expect(toursPath.get!.operationId).toBe('ToursController_findAll');
    });

    it('should add requestBody with schema ref for POST /tours', () => {
      const paths = builder.buildPaths(sampleEndpointMap, sampleSchemaMap);
      const toursPath = paths['/tours'] as OpenAPIV3.PathItemObject;
      const postOp = toursPath.post!;
      expect(postOp.requestBody).toBeDefined();

      const body = postOp.requestBody as OpenAPIV3.RequestBodyObject;
      const jsonContent = body.content['application/json'];
      const schema = jsonContent!.schema as OpenAPIV3.ReferenceObject;
      expect(schema.$ref).toBe('#/components/schemas/CreateTourDto');
    });

    it('should produce 204 response for DELETE /tours/{id}', () => {
      const paths = builder.buildPaths(sampleEndpointMap, sampleSchemaMap);
      const idPath = paths['/tours/{id}'] as OpenAPIV3.PathItemObject;
      const deleteOp = idPath.delete!;
      expect(deleteOp.responses).toHaveProperty('204');
      const response = deleteOp.responses['204'] as OpenAPIV3.ResponseObject;
      expect(response.description).toBe('No Content');
    });

    it('should add security requirement for authenticated routes', () => {
      const paths = builder.buildPaths(sampleEndpointMap, sampleSchemaMap);
      const toursPath = paths['/tours'] as OpenAPIV3.PathItemObject;
      const postOp = toursPath.post!;
      expect(postOp.security).toEqual([{ BearerAuth: [] }]);
    });

    it('should set empty security for public routes', () => {
      const paths = builder.buildPaths(sampleEndpointMap, sampleSchemaMap);
      const toursPath = paths['/tours'] as OpenAPIV3.PathItemObject;
      const getOp = toursPath.get!;
      expect(getOp.security).toEqual([]);
    });

    it('should include query parameters for GET /tours', () => {
      const paths = builder.buildPaths(sampleEndpointMap, sampleSchemaMap);
      const toursPath = paths['/tours'] as OpenAPIV3.PathItemObject;
      const getOp = toursPath.get!;
      const params = getOp.parameters as OpenAPIV3.ParameterObject[];
      expect(params).toHaveLength(2);
      expect(params[0]!.name).toBe('page');
      expect(params[0]!.in).toBe('query');
      expect(params[1]!.name).toBe('limit');
    });
  });
});
