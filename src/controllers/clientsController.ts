/**
 * Clients Controller
 */

import { IReq, IRes } from '../common/types';
import { BaseController } from '../common/BaseController';
import { ClientsService } from '../services/clientsService';
import { serializeBigInt } from '../utils/serializeBigInt';
import { parsePaginationParams } from '../utils/pagination';
import { getActorFromUser } from '../utils/audit';

export class ClientsController extends BaseController {
  private clientsService: ClientsService;
  
  constructor({ clientsService }: { clientsService: ClientsService }) {
    super();
    this.clientsService = clientsService;
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
  
  async consultDocument(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const { document } = req.params;
    
    const client = await this.clientsService.findByDocument(document as string);

    if (!client) {
      this.notFound('Client not found');
      return;
    }

    this.ok(serializeBigInt(client));
  }

  async create(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    
    // Get accountId from body or from authenticated user (optional for onboarding)
    const body = req.body as any;
    const accountId = body.accountId || req.user?.accountId;

    const actor = getActorFromUser(req.user);
    const client = await this.clientsService.create(
      { ...body, accountId },
      actor
    );
    this.created(serializeBigInt(client));
  }

  async update(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const actor = getActorFromUser(req.user);
    const client = await this.clientsService.update(id, req.body as any, actor);
    this.ok(serializeBigInt(client));
  }

  async delete(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    await this.clientsService.delete(id);
    this.noContent();
  }
}

