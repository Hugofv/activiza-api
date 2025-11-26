/**
 * Admin Features Controller
 */

import { IReq, IRes } from '../../common/types';
import { BaseController } from '../../common/BaseController';
import { FeaturesService } from '../../services/features';
import { serializeBigInt } from '../../utils/serializeBigInt';
import { parsePaginationParams } from '../../utils/pagination';
import { PrismaClient } from '@prisma/client';
import { getActorFromUser } from '../../utils/audit';

export class AdminFeaturesController extends BaseController {
  private featuresService: FeaturesService;
  
  constructor({ prisma }: { prisma: PrismaClient }) {
    super();
    this.featuresService = new FeaturesService(prisma);
  }

  async index(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const { page, limit } = parsePaginationParams(req.query);
    const category = req.query.category as string | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const result = await this.featuresService.findAll({ page, limit, category, isActive });
    this.ok(serializeBigInt(result));
  }

  async show(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const feature = await this.featuresService.findById(id);

    if (!feature) {
      this.notFound('Feature not found');
      return;
    }

    this.ok(serializeBigInt(feature));
  }

  async findByKey(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const key = req.params.key as string;
    const feature = await this.featuresService.findByKey(key);

    if (!feature) {
      this.notFound('Feature not found');
      return;
    }

    this.ok(serializeBigInt(feature));
  }

  async create(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const feature = await this.featuresService.create(req.body as any, getActorFromUser(req.user));
    this.created(serializeBigInt(feature));
  }

  async update(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const feature = await this.featuresService.update(id, req.body as any, getActorFromUser(req.user));
    this.ok(serializeBigInt(feature));
  }

  async delete(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    await this.featuresService.delete(id);
    this.noContent();
  }
}

