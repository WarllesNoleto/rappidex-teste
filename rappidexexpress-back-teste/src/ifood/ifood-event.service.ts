import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { IfoodEventEntity } from '../database/entities';

@Injectable()
export class IfoodEventService implements OnModuleInit {
  private readonly logger = new Logger(IfoodEventService.name);
  private static readonly DEFAULT_CUTOFF = new Date('2026-06-01T00:00:00.000Z');
  constructor(
    @InjectRepository(IfoodEventEntity)
    private readonly ifoodEventRepository: MongoRepository<IfoodEventEntity>,
  ) {}

  async onModuleInit() {
    await this.ensureIndexes();
  }

  private async ensureIndexes() {
    try {
      await this.ifoodEventRepository.createCollectionIndex(
        { eventId: 1 },
        { unique: true, name: 'IDX_IFOOD_EVENT_ID_UNIQUE' },
      );
      await this.ifoodEventRepository.createCollectionIndex(
        { processedAt: 1 },
        { name: 'IDX_IFOOD_EVENT_PROCESSED_AT' },
      );
      await this.ifoodEventRepository.createCollectionIndex(
        { orderId: 1 },
        { name: 'IDX_IFOOD_EVENT_ORDER_ID' },
      );
    } catch (error: any) {
      this.logger.warn(
        `Não foi possível garantir índices de eventos iFood. ${error?.message || error}`,
      );
    }
  }

  async findByEventId(eventId: string) {
    return this.ifoodEventRepository.findOneBy({ eventId });
  }

  async findByOrderId(orderId: string) {
    const events = await this.ifoodEventRepository.find({
      where: { orderId } as any,
    });

    return Array.isArray(events) ? events : [];
  }

  async hasDeliveryDropCodeRequested(orderId: string) {
    const events = await this.findByOrderId(orderId);

    return events.some(
      (event) => event?.fullCode === 'DELIVERY_DROP_CODE_REQUESTED',
    );
  }

  async findRecentEligibleImportEvents(limit = 500) {
    const events = await this.ifoodEventRepository.find({
      where: {
        $or: [
          { code: 'CFM' },
          { code: 'CONFIRMED' },
          { code: 'DSP' },
          { code: 'RTP' },
          { fullCode: 'CONFIRMED' },
          { fullCode: 'DISPATCHED' },
          { fullCode: 'READY_TO_PICKUP' },
        ],
      } as any,
      order: { processedAt: 'DESC' },
      take: limit,
    });

    return Array.isArray(events) ? events : [];
  }

  async cleanupOldEventsBefore(cutoff = IfoodEventService.DEFAULT_CUTOFF) {
    const normalizedCutoff = cutoff instanceof Date ? cutoff : new Date(cutoff);
    const result = await this.ifoodEventRepository.deleteMany({
      createdAt: { $lt: normalizedCutoff.toISOString() },
    } as any);
    return {
      deleted: result?.deletedCount || 0,
      cutoff: normalizedCutoff.toISOString(),
    };
  }

  async countEvents() {
    return this.ifoodEventRepository.count({});
  }

  async markAsProcessed(
    event: {
      id: string;
      orderId?: string;
      merchantId?: string;
      code?: string;
      fullCode?: string;
      salesChannel?: string;
      createdAt?: string;
    },
    acknowledged = false,
  ) {
    const payload = {
      eventId: event.id,
      orderId: event.orderId ?? '',
      merchantId: event.merchantId ?? '',
      code: event.code ?? '',
      fullCode: event.fullCode ?? '',
      salesChannel: event.salesChannel ?? '',
      createdAt: event.createdAt ?? '',
      processedAt: new Date(),
      acknowledged,
    };

    await this.ifoodEventRepository.updateOne(
      { eventId: event.id } as any,
      { $setOnInsert: payload, $set: { acknowledged } } as any,
      { upsert: true } as any,
    );

    return payload;
  }

  async markAsAcknowledged(eventId: string) {
    await this.ifoodEventRepository.updateOne({ eventId }, {
      $set: {
        acknowledged: true,
      },
    } as any);
  }

  async findUnacknowledgedEventIds(limit = 500) {
    const events = await this.findUnacknowledgedEvents(limit);

    return events.map((event) => event.eventId);
  }

  async findUnacknowledgedEvents(limit = 500) {
    const events = await this.ifoodEventRepository.find({
      where: {
        acknowledged: false,
      } as any,
      take: limit,
      select: {
        eventId: true,
        merchantId: true,
      } as any,
    });

    return (Array.isArray(events) ? events : [])
      .map((event) => ({
        eventId: String(event?.eventId || '').trim(),
        merchantId: String((event as any)?.merchantId || '').trim(),
      }))
      .filter((event) => Boolean(event.eventId));
  }
}
