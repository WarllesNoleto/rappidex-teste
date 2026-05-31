import {
  PaymentType,
  StatusDelivery,
} from '../../shared/constants/enums.constants';
import { CreateDeliveryDto } from '../../delivery/dto';
import { UserEntity } from '../../database/entities';

function normalizeText(value: unknown): string {
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

function normalizeKey(key: string): string {
  return key.replace(/[_\-\s]/g, '').toLowerCase();
}

function collectValues(payload: any, targetFields: string[]): string[] {
  const values: string[] = [];
  const targetKeys = new Set(targetFields.map(normalizeKey));
  const visited = new WeakSet<object>();

  function visit(value: any) {
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
      if (targetKeys.has(normalizeKey(key))) {
        const normalized = normalizeText(entryValue);
        if (normalized) {
          values.push(normalized);
        }
      }

      if (entryValue && typeof entryValue === 'object') {
        visit(entryValue);
      }
    });
  }

  visit(payload);
  return values;
}

function firstValue(payload: any, fields: string[], fallback = ''): string {
  return collectValues(payload, fields)[0] || fallback;
}

function getPaymentType(payload: any): PaymentType {
  const payment = firstValue(payload, [
    'payment',
    'paymentMethod',
    'payment_method',
    'paymentType',
    'payment_type',
  ]).toLowerCase();

  if (payment.includes('pix')) {
    return PaymentType.PIX;
  }

  if (
    payment.includes('card') ||
    payment.includes('cartao') ||
    payment.includes('cartão') ||
    payment.includes('credit') ||
    payment.includes('debit')
  ) {
    return PaymentType.CARTAO;
  }

  if (
    payment.includes('cash') ||
    payment.includes('dinheiro') ||
    payment.includes('money')
  ) {
    return PaymentType.DINHEIRO;
  }

  return PaymentType.PAGO;
}

function getOrderValue(payload: any): string {
  return firstValue(
    payload,
    [
      'total',
      'totalValue',
      'total_value',
      'value',
      'amount',
      'price',
      'subtotal',
    ],
    '0',
  );
}

export function getIntegrationOrigin(payload: any): string {
  return firstValue(payload, [
    'origin',
    'source',
    'marketplace',
    'channel',
    'integration',
    'platform',
  ]);
}

export function mapAnotaAiPayloadToDelivery(
  payload: any,
  establishment: UserEntity,
  orderId: string,
): CreateDeliveryDto {
  const clientName = firstValue(
    payload,
    ['clientName', 'client_name', 'customerName', 'customer_name', 'name'],
    'Cliente Anota AI',
  );
  const clientPhone = firstValue(payload, [
    'clientPhone',
    'client_phone',
    'customerPhone',
    'customer_phone',
    'phone',
    'telephone',
  ]);
  const clientAddress = firstValue(payload, [
    'clientAddress',
    'client_address',
    'deliveryAddress',
    'delivery_address',
    'address',
    'street',
    'formattedAddress',
    'formatted_address',
  ]);
  const observation = firstValue(payload, [
    'observation',
    'notes',
    'note',
    'comments',
    'customerNote',
    'customer_note',
  ]);

  return {
    clientName,
    clientPhone,
    clientLocation: clientAddress,
    clientAddress,
    addressComplement: firstValue(payload, [
      'complement',
      'addressComplement',
      'address_complement',
    ]),
    addressReference: firstValue(payload, [
      'reference',
      'addressReference',
      'address_reference',
    ]),
    addressNeighborhood: firstValue(payload, [
      'neighborhood',
      'district',
      'addressNeighborhood',
      'address_neighborhood',
    ]),
    addressCity: firstValue(payload, ['city', 'addressCity', 'address_city']),
    addressState: firstValue(payload, [
      'state',
      'addressState',
      'address_state',
      'uf',
    ]),
    addressZipCode: firstValue(payload, [
      'zipCode',
      'zip_code',
      'postalCode',
      'postal_code',
      'cep',
    ]),
    addressMapsUrl: firstValue(payload, [
      'mapsUrl',
      'maps_url',
      'googleMapsUrl',
      'google_maps_url',
    ]),
    status: StatusDelivery.AWAITING_RELEASE,
    establishmentId: establishment.id,
    value: getOrderValue(payload),
    payment: getPaymentType(payload),
    soda: 'NÃO',
    observation,
    source: 'anotaai',
    externalOrderId: orderId,
    anotaAiOrderId: orderId,
    integrationOrigin: getIntegrationOrigin(payload),
    rawIntegrationPayload: payload,
  };
}
