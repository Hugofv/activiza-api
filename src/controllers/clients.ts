/**
 * Clients Controller
 */

import { IReq, IRes } from '../common/types';
import { BaseController } from '../common/BaseController';
import { ClientsService } from '../services/clients';
import { serializeBigInt } from '../utils/serializeBigInt';
import { parsePaginationParams } from '../utils/pagination';

export class ClientsController extends BaseController {
  constructor(private clientsService: ClientsService) {
    super();
  }

  async index(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const { page, limit } = parsePaginationParams(req.query);
    const accountId = req.query.accountId ? Number(req.query.accountId) : undefined;
    const q = req.query.q as string | undefined;

    const result = await this.clientsService.findAll({ page, limit, accountId, q });
    this.ok(serializeBigInt(result));
  }

  async show(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const client = await this.clientsService.findById(id);

    if (!client) {
      this.notFound('Client not found');
      return;
    }

    this.ok(serializeBigInt(client));
  }

  async create(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const client = await this.clientsService.create(req.body);
    this.created(serializeBigInt(client));
  }

  async update(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const client = await this.clientsService.update(id, req.body);
    this.ok(serializeBigInt(client));
  }

  async delete(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    await this.clientsService.delete(id);
    this.noContent();
  }
}

