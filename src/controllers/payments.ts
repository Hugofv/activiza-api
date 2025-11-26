/**
 * Payments Controller
 */

import { IReq, IRes } from '../common/types';
import { BaseController } from '../common/BaseController';
import { PaymentsService } from '../services/payments';
import { serializeBigInt } from '../utils/serializeBigInt';
import { parsePaginationParams } from '../utils/pagination';
import { PrismaClient } from '@prisma/client';

export class PaymentsController extends BaseController {
  private paymentsService: PaymentsService;
  
  constructor({ prisma }: { prisma: PrismaClient }) {
    super();
    this.paymentsService = new PaymentsService(prisma);
  }

  async index(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const { page, limit } = parsePaginationParams(req.query);
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    const operationId = req.query.operationId 
      ? BigInt(String(req.query.operationId)) 
      : undefined;
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;

    const result = await this.paymentsService.findAll({
      page,
      limit,
      clientId,
      operationId,
      from,
      to,
    });
    this.ok(serializeBigInt(result));
  }

  async show(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = BigInt(String(req.params.id));
    const payment = await this.paymentsService.findById(id);

    if (!payment) {
      this.notFound('Payment not found');
      return;
    }

    this.ok(serializeBigInt(payment));
  }

  async create(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const payment = await this.paymentsService.create(req.body as any);
    this.created(serializeBigInt(payment));
  }
}

