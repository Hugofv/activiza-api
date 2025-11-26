/**
 * Admin Qualifications Controller
 */

import { IReq, IRes } from '../../common/types';
import { BaseController } from '../../common/BaseController';
import { QualificationsService } from '../../services/qualifications';
import { serializeBigInt } from '../../utils/serializeBigInt';
import { parsePaginationParams } from '../../utils/pagination';
import { PrismaClient } from '@prisma/client';
import { getActorFromUser } from '../../utils/audit';

export class AdminQualificationsController extends BaseController {
  private qualificationsService: QualificationsService;
  
  constructor({ prisma }: { prisma: PrismaClient }) {
    super();
    this.qualificationsService = new QualificationsService(prisma);
  }

  async index(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const { page, limit } = parsePaginationParams(req.query);
    const accountId = req.query.accountId ? Number(req.query.accountId) : undefined;
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;

    const result = await this.qualificationsService.findAll({ page, limit, accountId, clientId });
    this.ok(serializeBigInt(result));
  }

  async show(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const qualification = await this.qualificationsService.findById(id);

    if (!qualification) {
      this.notFound('Qualification not found');
      return;
    }

    this.ok(serializeBigInt(qualification));
  }

  async findByAccount(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const accountId = Number(req.params.accountId);
    const qualifications = await this.qualificationsService.findByAccount(accountId);
    this.ok(serializeBigInt(qualifications));
  }

  async findByClient(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const clientId = Number(req.params.clientId);
    const qualifications = await this.qualificationsService.findByClient(clientId);
    this.ok(serializeBigInt(qualifications));
  }

  async create(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const qualification = await this.qualificationsService.create(req.body as any, getActorFromUser(req.user));
    this.created(serializeBigInt(qualification));
  }

  async saveAnswers(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const qualifications = await this.qualificationsService.saveAnswers(req.body as any, getActorFromUser(req.user));
    this.ok(serializeBigInt(qualifications));
  }

  async update(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const qualification = await this.qualificationsService.update(id, req.body as any, getActorFromUser(req.user));
    this.ok(serializeBigInt(qualification));
  }

  async delete(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    await this.qualificationsService.delete(id);
    this.noContent();
  }
}

