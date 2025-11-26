/**
 * Admin Modules Controller
 */

import { IReq, IRes } from '../../common/types';
import { BaseController } from '../../common/BaseController';
import { ModulesService } from '../../services/modules';
import { serializeBigInt } from '../../utils/serializeBigInt';
import { parsePaginationParams } from '../../utils/pagination';
import { PrismaClient } from '@prisma/client';
import { getActorFromUser } from '../../utils/audit';

export class AdminModulesController extends BaseController {
  private modulesService: ModulesService;

  constructor({ prisma }: { prisma: PrismaClient }) {
    super();
    this.modulesService = new ModulesService(prisma);
  }

  async index(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const { page, limit } = parsePaginationParams(req.query);
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const result = await this.modulesService.findAll({ page, limit, isActive });
    this.ok(serializeBigInt(result));
  }

  async show(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const moduleEntity = await this.modulesService.findById(id);

    if (!moduleEntity) {
      this.notFound('Module not found');
      return;
    }

    this.ok(serializeBigInt(moduleEntity));
  }

  async create(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const moduleEntity = await this.modulesService.create(req.body as any, getActorFromUser(req.user));
    this.created(serializeBigInt(moduleEntity));
  }

  async update(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const moduleEntity = await this.modulesService.update(id, req.body as any, getActorFromUser(req.user));
    this.ok(serializeBigInt(moduleEntity));
  }

  async delete(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    await this.modulesService.delete(id);
    this.noContent();
  }
}