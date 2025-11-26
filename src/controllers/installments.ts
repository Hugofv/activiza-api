/**
 * Installments Controller
 */

import { IReq, IRes } from '../common/types';
import { BaseController } from '../common/BaseController';
import { InstallmentsService } from '../services/installments';
import { serializeBigInt } from '../utils/serializeBigInt';
import { parsePaginationParams } from '../utils/pagination';
import { PrismaClient } from '@prisma/client';

export class InstallmentsController extends BaseController {
  private installmentsService: InstallmentsService;
  
  constructor({ prisma }: { prisma: PrismaClient }) {
    super();
    this.installmentsService = new InstallmentsService(prisma);
  }

  async index(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const { page, limit } = parsePaginationParams(req.query);
    const operationId = req.query.operationId 
      ? BigInt(req.query.operationId as string) 
      : undefined;
    const status = req.query.status as string | undefined;
    const dueDateFrom = req.query.dueDateFrom 
      ? new Date(req.query.dueDateFrom as string) 
      : undefined;
    const dueDateTo = req.query.dueDateTo 
      ? new Date(req.query.dueDateTo as string) 
      : undefined;

    const result = await this.installmentsService.findAll({
      page,
      limit,
      operationId,
      status,
      dueDateFrom,
      dueDateTo,
    });
    this.ok(serializeBigInt(result));
  }

  async show(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = BigInt(String(req.params.id));
    const installment = await this.installmentsService.findById(id);

    if (!installment) {
      this.notFound('Installment not found');
      return;
    }

    this.ok(serializeBigInt(installment));
  }

  async update(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = BigInt(String(req.params.id));
    const installment = await this.installmentsService.update(id, req.body as any);
    this.ok(serializeBigInt(installment));
  }

  async markPaid(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = BigInt(String(req.params.id));
    const body = req.body as any;
    const installment = await this.installmentsService.markPaid(id, {
      amount: body.amount,
      method: body.method,
      clientId: body.clientId ? Number(body.clientId) : undefined,
      operationId: body.operationId ? BigInt(String(body.operationId)) : undefined,
    });

    this.ok(serializeBigInt(installment));
  }
}

