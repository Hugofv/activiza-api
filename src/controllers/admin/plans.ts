/**
 * Admin Plans Controller
 */

import { IReq, IRes } from '../../common/types';
import { BaseController } from '../../common/BaseController';
import { PlansService } from '../../services/plans';
import { serializeBigInt } from '../../utils/serializeBigInt';
import { parsePaginationParams } from '../../utils/pagination';
import { PrismaClient } from '@prisma/client';
import { getActorFromUser } from '../../utils/audit';

export class AdminPlansController extends BaseController {
  private plansService: PlansService;
  
  constructor({ prisma }: { prisma: PrismaClient }) {
    super();
    this.plansService = new PlansService(prisma);
  }

  async index(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const { page, limit } = parsePaginationParams(req.query);
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const isPublic = req.query.isPublic === 'true' ? true : req.query.isPublic === 'false' ? false : undefined;

    const result = await this.plansService.findAll({ page, limit, isActive, isPublic });
    this.ok(serializeBigInt(result));
  }

  async show(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const plan = await this.plansService.findById(id);

    if (!plan) {
      this.notFound('Plan not found');
      return;
    }

    this.ok(serializeBigInt(plan));
  }

  async create(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const plan = await this.plansService.create(req.body as any, getActorFromUser(req.user));
    this.created(serializeBigInt(plan));
  }

  async update(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const plan = await this.plansService.update(id, req.body as any, getActorFromUser(req.user));
    this.ok(serializeBigInt(plan));
  }

  async delete(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    await this.plansService.delete(id);
    this.noContent();
  }

  async getRecommended(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const body = req.body as { answers?: Array<{ questionKey: string; answer: unknown }> };
    const answers = body.answers || [];
    const plans = await this.plansService.getRecommendedPlans(answers);
    this.ok(serializeBigInt(plans));
  }
}

