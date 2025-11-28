/**
 * Clients Controller Tests
 */

import { ClientsController } from '../controllers/clientsController';
import { ClientsService } from '../services/clientsService';
import { IReq, IRes } from '../common/types';
import HttpStatusCodes from '../common/HttpStatusCodes';

// Mock the service
jest.mock('../services/clientsService');

describe('ClientsController', () => {
  let controller: ClientsController;
  let mockService: jest.Mocked<ClientsService>;
  let mockReq: Partial<IReq>;
  let mockRes: Partial<IRes>;

  beforeEach(() => {
    mockService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByDocument: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ClientsService>;

    controller = new ClientsController({ clientsService: mockService });

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { id: 1, role: 'owner' },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as IRes;
  });

  describe('consultDocument', () => {
    it('should return client when document exists', async () => {
      const mockClient = {
        id: BigInt(1),
        name: 'John Doe',
        document: '12345678900',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockService.findByDocument.mockResolvedValue(mockClient as any);
      mockReq.params = { document: '12345678900' };

      await controller.consultDocument(mockReq as IReq, mockRes as IRes);

      expect(mockService.findByDocument).toHaveBeenCalledWith('12345678900');
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCodes.OK);
      // Note: serializeBigInt handles BigInt serialization, but here we just check if json was called
      // The BaseController.ok method wraps the response in { success: true, data: ... }
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          document: '12345678900'
        })
      }));
    });

    it('should return 404 when client not found', async () => {
      mockService.findByDocument.mockResolvedValue(null);
      mockReq.params = { document: '00000000000' };

      await controller.consultDocument(mockReq as IReq, mockRes as IRes);

      expect(mockService.findByDocument).toHaveBeenCalledWith('00000000000');
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCodes.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Client not found'
        })
      }));
    });
  });
});
