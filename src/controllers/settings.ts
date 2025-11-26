/**
 * Settings Controller
 */

import { IReq, IRes } from '../common/types';
import { BaseController } from '../common/BaseController';
import { SettingsService } from '../services/settings';
import { serializeBigInt } from '../utils/serializeBigInt';
import { parsePaginationParams } from '../utils/pagination';
import { PrismaClient } from '@prisma/client';

export class SettingsController extends BaseController {
  private settingsService: SettingsService;
  
  constructor({ prisma }: { prisma: PrismaClient }) {
    super();
    this.settingsService = new SettingsService(prisma);
  }

  async index(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const { page, limit } = parsePaginationParams(req.query);
    const accountId = req.query.accountId ? Number(req.query.accountId) : null;

    const result = await this.settingsService.findAll({ page, limit, accountId: accountId ?? undefined });
    this.ok(serializeBigInt(result));
  }

  async show(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const accountId = req.query.accountId ? Number(req.query.accountId) : null;
    const key = req.params.key as string;
    const setting = await this.settingsService.findByKey(accountId, key);

    if (!setting) {
      this.notFound('Setting not found');
      return;
    }

    this.ok(serializeBigInt(setting));
  }

  async create(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const setting = await this.settingsService.create(req.body as any);
    this.created(serializeBigInt(setting));
  }

  async update(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const accountId = req.body.accountId ? Number(req.body.accountId) : null;
    const key = req.params.key as string;
    const setting = await this.settingsService.update(accountId, key, req.body);
    this.ok(serializeBigInt(setting));
  }

  async upsert(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const accountId = req.body.accountId ? Number(req.body.accountId) : null;
    const key = req.params.key as string;
    const setting = await this.settingsService.upsert(accountId, key, req.body.value);
    this.ok(serializeBigInt(setting));
  }

  async delete(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const accountId = req.query.accountId ? Number(req.query.accountId) : null;
    const key = req.params.key as string;
    await this.settingsService.delete(accountId, key);
    this.noContent();
  }
}

