/**
 * Platform Users Controller
 */

import { IReq, IRes } from '../common/types';
import { BaseController } from '../common/BaseController';
import { PlatformUsersService } from '../services/platformUsers';
import { serializeBigInt } from '../utils/serializeBigInt';
import { parsePaginationParams } from '../utils/pagination';

export class PlatformUsersController extends BaseController {
  constructor(private platformUsersService: PlatformUsersService) {
    super();
  }

  async index(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const { page, limit } = parsePaginationParams(req.query);
    const role = req.query.role as string | undefined;
    const q = req.query.q as string | undefined;

    const result = await this.platformUsersService.findAll({ page, limit, role, q });
    this.ok(serializeBigInt(result));
  }

  async show(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const user = await this.platformUsersService.findById(id);

    if (!user) {
      this.notFound('User not found');
      return;
    }

    this.ok(serializeBigInt(user));
  }

  async create(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const user = await this.platformUsersService.create(req.body);
    this.created(serializeBigInt(user));
  }

  async update(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const user = await this.platformUsersService.update(id, req.body);
    this.ok(serializeBigInt(user));
  }

  async delete(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    await this.platformUsersService.delete(id);
    this.noContent();
  }
}

