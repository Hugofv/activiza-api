/**
 * Resources Controller
 */

import { IReq, IRes } from '../common/types';
import { BaseController } from '../common/BaseController';
import { ResourcesService } from '../services/resources';
import { serializeBigInt } from '../utils/serializeBigInt';
import { parsePaginationParams } from '../utils/pagination';

export class ResourcesController extends BaseController {
  constructor(private resourcesService: ResourcesService) {
    super();
  }

  async index(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const { page, limit } = parsePaginationParams(req.query);
    const accountId = req.query.accountId ? Number(req.query.accountId) : undefined;
    const type = req.query.type as string | undefined;

    const result = await this.resourcesService.findAll({ page, limit, accountId, type });
    this.ok(serializeBigInt(result));
  }

  async show(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const resource = await this.resourcesService.findById(id);

    if (!resource) {
      this.notFound('Resource not found');
      return;
    }

    this.ok(serializeBigInt(resource));
  }

  async create(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const resource = await this.resourcesService.create(req.body);
    this.created(serializeBigInt(resource));
  }

  async update(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const resource = await this.resourcesService.update(id, req.body);
    this.ok(serializeBigInt(resource));
  }

  async delete(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    await this.resourcesService.delete(id);
    this.noContent();
  }
}

