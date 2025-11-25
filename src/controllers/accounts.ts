/**
 * Accounts Controller
 */

import { IReq, IRes } from '../common/types';
import { BaseController } from '../common/BaseController';
import { AccountsService } from '../services/accounts';
import { serializeBigInt } from '../utils/serializeBigInt';
import { parsePaginationParams } from '../utils/pagination';

export class AccountsController extends BaseController {
  constructor(private accountsService: AccountsService) {
    super();
  }

  async index(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const { page, limit } = parsePaginationParams(req.query);
    const q = req.query.q as string | undefined;
    const ownerId = req.query.ownerId ? Number(req.query.ownerId) : undefined;

    const result = await this.accountsService.findAll({ page, limit, q, ownerId });
    this.ok(serializeBigInt(result));
  }

  async show(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const account = await this.accountsService.findById(id);

    if (!account) {
      this.notFound('Account not found');
      return;
    }

    this.ok(serializeBigInt(account));
  }

  async create(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const account = await this.accountsService.create(req.body as any, req.user?.id);
    this.created(serializeBigInt(account));
  }

  async update(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const account = await this.accountsService.update(id, req.body);
    this.ok(serializeBigInt(account));
  }

  async delete(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    await this.accountsService.delete(id);
    this.noContent();
  }
}

