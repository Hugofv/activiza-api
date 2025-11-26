/**
 * Notifications Controller
 */

import { IReq, IRes } from '~@/common/types';
import { BaseController } from '~@/common/BaseController';
import { NotificationsService } from '~@/services/notificationsService';
import { serializeBigInt } from '~@/utils/serializeBigInt';
import { parsePaginationParams } from '~@/utils/pagination';
export class NotificationsController extends BaseController {
  private notificationsService: NotificationsService;
  
  constructor({ notificationsService }: { notificationsService: NotificationsService }) {
    super();
    this.notificationsService = notificationsService;
  }

  async index(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const { page, limit } = parsePaginationParams(req.query);
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const read = req.query.read !== undefined ? req.query.read === 'true' : undefined;
    const channel = req.query.channel as string | undefined;

    const result = await this.notificationsService.findAll({ page, limit, userId, read, channel });
    this.ok(serializeBigInt(result));
  }

  async show(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const notification = await this.notificationsService.findById(id);

    if (!notification) {
      this.notFound('Notification not found');
      return;
    }

    this.ok(serializeBigInt(notification));
  }

  async create(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const notification = await this.notificationsService.create(req.body as any);
    this.created(serializeBigInt(notification));
  }

  async update(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const notification = await this.notificationsService.update(id, req.body as any);
    this.ok(serializeBigInt(notification));
  }

  async markAsRead(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    const notification = await this.notificationsService.markAsRead(id);
    this.ok(serializeBigInt(notification));
  }

  async delete(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    const id = Number(req.params.id);
    await this.notificationsService.delete(id);
    this.noContent();
  }
}

