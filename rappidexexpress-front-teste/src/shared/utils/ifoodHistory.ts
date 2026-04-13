export function translateIfoodOperationType(operationType?: string) {
  switch (operationType) {
    case 'ADD':
      return 'Adição';
    case 'REMOVE':
      return 'Remoção';
    case 'CONSUME':
      return 'Consumo';
    case 'REFUND':
      return 'Estorno';
    default:
      return operationType || '-';
  }
}