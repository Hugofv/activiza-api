/**
 * Alerts Controller
 */

import { IReq, IRes } from '../common/types';
import { BaseController } from '../common/BaseController';
import { AlertsService } from '../services/alerts';
import { serializeBigInt } from '../utils/serializeBigInt';
import { parsePaginationParams } from '../utils/pagination';

export class AlertsController extends BaseController {
  constructor(private alertsService: AlertsService) {
    super();
  }

  async index(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const { page, limit } = parsePaginationParams(req.query);
    const operationId = req.query.operationId 
      ? BigInt(req.query.operationId as string) 
      : undefined;
    const enabled = req.query.enabled !== undefined 
      ? req.query.enabled === 'true' 
      : undefined;

    const result = await this.alertsService.findAll({ page, limit, operationId, enabled });
    this.ok(serializeBigInt(result));
  }

  async show(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const alert = await this.alertsService.findById(id);

    if (!alert) {
      this.notFound('Alert not found');
      return;
    }

    this.ok(serializeBigInt(alert));
  }

  async create(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const alert = await this.alertsService.create({
      ...req.body,
      operationId: BigInt(req.body.operationId),
    });
    this.created(serializeBigInt(alert));
  }

  async update(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const alert = await this.alertsService.update(id, req.body);
    this.ok(serializeBigInt(alert));
  }

  async delete(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    await this.alertsService.delete(id);
    this.noContent();
  }
}

