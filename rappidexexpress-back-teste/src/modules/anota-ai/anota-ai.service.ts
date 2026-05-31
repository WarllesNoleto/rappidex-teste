import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { DeliveryEntity, UserEntity } from '../../database/entities';
import { DeliveryService } from '../../delivery/delivery.service';
import { UserType } from '../../shared/constants/enums.constants';
import { mapAnotaAiPayloadToDelivery } from './anota-ai.mapper';

const ACCEPTED_STATUSES = new Set([
  'accepted',
  'confirmed',
  'approved',
  'preparing',
  'aceito',
  'confirmado',
  'em_preparo',
  'preparo',
]);

const IFOOD_FIELDS = [
  'origin',
  'source',
  'marketplace',
  'channel',
  'integration',
  'platform',
  'ifoodOrderId',
  'ifood_order_id',
];

@Injectable()
export class AnotaAiService {
  private readonly logger = new Logger(AnotaAiService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: MongoRepository<UserEntity>,
    @InjectRepository(DeliveryEntity)
    private readonly deliveryRepository: MongoRepository<DeliveryEntity>,
    private readonly deliveryService: DeliveryService,
  ) {}

  async processWebhook(payload: any) {
    this.logger.log('[ANOTA AI] Webhook recebido');
    this.logger.log(`[ANOTA AI] Payload recebido ${this.safeJson(payload)}`);

    try {
      if (!this.isAcceptedAnotaAiOrder(payload)) {
        this.logger.log('[ANOTA AI] Pedido ainda não aceito, ignorando');
        return { received: true, ignored: true, reason: 'order_not_accepted' };
      }

      this.logger.log('[ANOTA AI] Pedido aceito/confirmado');

      const storeId = this.getAnotaAiStoreId(payload);
      const store = storeId
        ? await this.findStoreByAnotaAiStoreId(storeId)
        : null;

      if (!store) {
        this.logger.warn('[ANOTA AI] Loja não vinculada');
        return { received: true, ignored: true, reason: 'store_not_linked' };
      }

      this.logger.log('[ANOTA AI] Loja vinculada encontrada');

      if (!this.isIntegrationEnabledForStore(store)) {
        this.logger.warn('[ANOTA AI] Integração desativada para esta loja');
        return {
          received: true,
          ignored: true,
          reason: 'integration_disabled',
        };
      }

      const orderId = this.getAnotaAiOrderId(payload);
      if (!orderId) {
        this.logger.warn(
          '[ANOTA AI] Loja vinculada encontrada, mas pedido veio sem ID externo',
        );
        return { received: true, ignored: true, reason: 'missing_order_id' };
      }

      const duplicatedAnotaAiOrder =
        await this.findDuplicatedAnotaAiOrder(orderId);
      if (duplicatedAnotaAiOrder) {
        this.logger.log('[ANOTA AI] Pedido duplicado ignorado');
        return { received: true, ignored: true, reason: 'duplicated_order' };
      }

      if (
        this.isIfoodOrderFromAnotaAi(payload) &&
        store.anotaAiIgnoreIfoodOrders !== false
      ) {
        const ifoodOrderId =
          this.getIfoodOrderIdFromAnotaAi(payload) || orderId;
        const duplicatedIfoodOrder =
          await this.findDuplicatedIfoodOrder(ifoodOrderId);

        if (duplicatedIfoodOrder) {
          this.logger.log(
            '[ANOTA AI] Pedido iFood ignorado para evitar duplicidade',
          );
          return {
            received: true,
            ignored: true,
            reason: 'duplicated_ifood_order',
          };
        }
      }

      const deliveryDto = mapAnotaAiPayloadToDelivery(payload, store, orderId);
      const delivery = await this.deliveryService.createDelivery(
        deliveryDto,
        {
          id: store.id,
          phone: store.phone || '',
          user: 'anota-ai.integration',
          type: store.type as any,
          permission: store.permission as any,
          cityId: store.cityId,
        },
        { skipCreditConsumption: true },
      );

      this.logger.log(
        '[ANOTA AI] Pedido criado no Rappidex em aguardando liberação',
      );

      return {
        received: true,
        created: true,
        deliveryId: delivery.id,
      };
    } catch (error: any) {
      this.logger.error(
        `[ANOTA AI] Erro ao processar webhook ${error?.message || error}`,
        error?.stack,
      );
      return { received: true, error: true };
    }
  }

  isAcceptedAnotaAiOrder(payload: any): boolean {
    const candidates = this.collectFieldValues(payload, [
      'status',
      'event',
      'eventType',
      'event_type',
      'state',
      'orderStatus',
      'order_status',
    ]);

    return candidates.some((value) =>
      ACCEPTED_STATUSES.has(this.normalizeStatus(value)),
    );
  }

  getAnotaAiStoreId(payload: any): string {
    return this.firstFieldValue(payload, [
      'storeId',
      'store_id',
      'merchantId',
      'merchant_id',
      'restaurantId',
      'restaurant_id',
      'establishmentId',
      'establishment_id',
    ]);
  }

  getAnotaAiOrderId(payload: any): string {
    return this.firstFieldValue(payload, [
      'id',
      'orderId',
      'order_id',
      'externalId',
      'external_id',
    ]);
  }

  isIfoodOrderFromAnotaAi(payload: any): boolean {
    const ifoodOrderId = this.getIfoodOrderIdFromAnotaAi(payload);
    if (ifoodOrderId) {
      return true;
    }

    return this.collectFieldValues(payload, IFOOD_FIELDS).some((value) =>
      value.toLowerCase().includes('ifood'),
    );
  }

  private getIfoodOrderIdFromAnotaAi(payload: any): string {
    return this.firstFieldValue(payload, ['ifoodOrderId', 'ifood_order_id']);
  }

  private async findStoreByAnotaAiStoreId(storeId: string) {
    return this.userRepository.findOne({
      where: {
        anotaAiStoreId: storeId,
        isActive: true,
        type: { $in: [UserType.SHOPKEEPER, UserType.SHOPKEEPERADMIN] },
      } as any,
    });
  }

  private isIntegrationEnabledForStore(store: UserEntity): boolean {
    const globallyEnabled =
      this.configService.get<string>('ANOTA_AI_ENABLED') !== 'false';
    return globallyEnabled && store.anotaAiEnabled === true;
  }

  private async findDuplicatedAnotaAiOrder(orderId: string) {
    return this.deliveryRepository.findOne({
      where: {
        $or: [
          { source: 'anotaai', externalOrderId: orderId },
          { source: 'anotaai', anotaAiOrderId: orderId },
          { anotaAiOrderId: orderId },
          { externalOrderId: orderId },
        ],
      } as any,
    });
  }

  private async findDuplicatedIfoodOrder(orderId: string) {
    return this.deliveryRepository.findOne({
      where: {
        $or: [
          { ifoodOrderId: orderId },
          { source: 'ifood', externalOrderId: orderId },
          { externalOrderId: orderId, ifoodOrderId: orderId },
        ],
      } as any,
    });
  }

  private collectFieldValues(payload: any, fields: string[]): string[] {
    const normalizedFields = new Set(
      fields.map((field) => this.normalizeKey(field)),
    );
    const values: string[] = [];
    const visited = new WeakSet<object>();

    const visit = (value: any) => {
      if (!value || typeof value !== 'object') {
        return;
      }

      if (visited.has(value)) {
        return;
      }
      visited.add(value);

      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }

      Object.entries(value).forEach(([key, entryValue]) => {
        if (normalizedFields.has(this.normalizeKey(key))) {
          const normalizedValue = this.normalizeText(entryValue);
          if (normalizedValue) {
            values.push(normalizedValue);
          }
        }

        if (entryValue && typeof entryValue === 'object') {
          visit(entryValue);
        }
      });
    };

    visit(payload);
    return values;
  }

  private firstFieldValue(payload: any, fields: string[]): string {
    return this.collectFieldValues(payload, fields)[0] || '';
  }

  private normalizeKey(value: string): string {
    return value.replace(/[_\-\s]/g, '').toLowerCase();
  }

  private normalizeText(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value).trim();
    }

    return '';
  }

  private normalizeStatus(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
  }

  private safeJson(payload: any): string {
    try {
      return JSON.stringify(payload);
    } catch (error) {
      void error;
      return '[payload não serializável]';
    }
  }
}
