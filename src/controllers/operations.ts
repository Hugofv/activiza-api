/**
 * Operations Controller
 */

import { IReq, IRes } from '../common/types';
import { BaseController } from '../common/BaseController';
import { OperationsService } from '../services/operations';
import { serializeBigInt } from '../utils/serializeBigInt';
import { parsePaginationParams } from '../utils/pagination';
import { PrismaClient } from '@prisma/client';

export class OperationsController extends BaseController {
  private operationsService: OperationsService;
  
  constructor({ prisma }: { prisma: PrismaClient }) {
    super();
    this.operationsService = new OperationsService(prisma);
  }

  async index(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const { page, limit } = parsePaginationParams(req.query);
    const accountId = req.query.accountId ? Number(req.query.accountId) : undefined;
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;

    const result = await this.operationsService.findAll({
      page,
      limit,
      accountId,
      clientId,
      status,
      type,
    });
    this.ok(serializeBigInt(result));
  }

  async show(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = BigInt(String(req.params.id));
    const operation = await this.operationsService.findById(id);

    if (!operation) {
      this.notFound('Operation not found');
      return;
    }

    this.ok(serializeBigInt(operation));
  }

  async create(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const operation = await this.operationsService.create(req.body as any);
    this.created(serializeBigInt(operation));
  }

  async update(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = BigInt(String(req.params.id));
    const operation = await this.operationsService.update(id, req.body as any);
    this.ok(serializeBigInt(operation));
  }

  async delete(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = BigInt(String(req.params.id));
    await this.operationsService.delete(id);
    this.noContent();
  }

  async registerPayment(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const operationId = BigInt(String(req.params.id));
    const body = req.body as any;
    const clientId = req.user?.accountId || body.clientId;
    
    if (!clientId) {
      this.badRequest('Client ID is required', 'VALIDATION_ERROR');
      return;
    }

    const payment = await this.operationsService.registerPayment(operationId, {
      amount: body.amount,
      method: body.method,
      installmentId: body.installmentId ? BigInt(String(body.installmentId)) : undefined,
      clientId: Number(clientId),
      reference: body.reference,
      meta: body.meta,
    });

    this.created(serializeBigInt(payment));
  }

  async triggerAlert(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const operationId = BigInt(String(req.params.id));
    const body = req.body as any;
    const alert = await this.operationsService.triggerAlert(operationId, {
      type: body.type,
      template: body.template,
      sendAt: body.sendAt ? new Date(body.sendAt) : undefined,
    });

    this.created(serializeBigInt(alert));
  }
}

