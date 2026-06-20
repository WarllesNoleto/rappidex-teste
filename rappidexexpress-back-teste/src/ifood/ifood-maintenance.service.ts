import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface CollectionCleanupPlan {
  collection: string;
  dateField: string | null;
  beforeCount: number;
  toDelete: number;
  afterCount?: number;
  deleted?: number;
  skippedReason?: string;
}

@Injectable()
export class IfoodMaintenanceService {
  private static readonly DEFAULT_CUTOFF = new Date('2026-06-01T00:00:00.000Z');
  private static readonly CLEANUP_COLLECTIONS = [
    'ifood_events',
    'ifood_event_entity',
    'ifood_webhook_events',
    'ifood_polling_events',
    'ifood_order_events',
    'ifood_import_logs',
    'logs',
    'log_entity',
    'webhook_logs',
  ];
  private static readonly DATE_FIELDS = [
    'createdAt',
    'updatedAt',
    'receivedAt',
    'date',
    'created_at',
    'processedAt',
  ];

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async previewCleanup(cutoff = IfoodMaintenanceService.DEFAULT_CUTOFF) {
    const normalizedCutoff = this.normalizeCutoff(cutoff);
    const plan = await this.buildCleanupPlan(normalizedCutoff);

    return {
      dryRun: true,
      cutoff: normalizedCutoff.toISOString(),
      dateFilter: `createdAt < ${normalizedCutoff.toISOString()} (ou updatedAt/receivedAt/date/created_at/processedAt quando createdAt não existir)`,
      totalToDelete: plan.reduce((sum, item) => sum + item.toDelete, 0),
      collections: plan,
      protectedCollections: [
        'users',
        'user_entity',
        'cities',
        'city_entity',
        'delivery_entity',
        'configurations',
        'integrations',
      ],
    };
  }

  async cleanupOldIfoodRecords(
    cutoff = IfoodMaintenanceService.DEFAULT_CUTOFF,
  ) {
    const normalizedCutoff = this.normalizeCutoff(cutoff);
    const before = await this.buildCleanupPlan(normalizedCutoff);
    const collections = await Promise.all(
      before.map(async (item) => {
        if (!item.dateField || item.toDelete === 0) {
          return {
            ...item,
            deleted: 0,
            afterCount: item.beforeCount,
          };
        }

        const collection = this.mongoCollection(item.collection);
        const result = await collection.deleteMany({
          [item.dateField]: { $lt: normalizedCutoff },
        });
        const afterCount = await collection.countDocuments();

        return {
          ...item,
          deleted: result.deletedCount || 0,
          afterCount,
        };
      }),
    );

    return {
      dryRun: false,
      cutoff: normalizedCutoff.toISOString(),
      totalDeleted: collections.reduce(
        (sum, item) => sum + (item.deleted || 0),
        0,
      ),
      collections,
    };
  }

  async collectionGrowthSnapshot() {
    const existingCollections = await this.existingCollectionNames();
    const collections = await Promise.all(
      IfoodMaintenanceService.CLEANUP_COLLECTIONS.filter((name) =>
        existingCollections.has(name),
      ).map(async (name) => ({
        name,
        documents: await this.mongoCollection(name).countDocuments(),
      })),
    );

    return {
      collections: collections.sort((a, b) => b.documents - a.documents),
      cleanupCutoff: IfoodMaintenanceService.DEFAULT_CUTOFF.toISOString(),
      cleanupDateFields: IfoodMaintenanceService.DATE_FIELDS,
    };
  }

  private async buildCleanupPlan(
    cutoff: Date,
  ): Promise<CollectionCleanupPlan[]> {
    const existingCollections = await this.existingCollectionNames();

    return Promise.all(
      IfoodMaintenanceService.CLEANUP_COLLECTIONS.map(
        async (collectionName) => {
          if (!existingCollections.has(collectionName)) {
            return {
              collection: collectionName,
              dateField: null,
              beforeCount: 0,
              toDelete: 0,
              skippedReason: 'Collection não existe no banco atual.',
            };
          }

          const collection = this.mongoCollection(collectionName);
          const beforeCount = await collection.countDocuments();
          const dateField = await this.resolveDateField(collectionName);

          if (!dateField) {
            return {
              collection: collectionName,
              dateField: null,
              beforeCount,
              toDelete: 0,
              skippedReason:
                'Nenhum campo de data encontrado (createdAt, updatedAt, receivedAt, date, created_at ou processedAt).',
            };
          }

          const toDelete = await collection.countDocuments({
            [dateField]: { $lt: cutoff },
          });

          return {
            collection: collectionName,
            dateField,
            beforeCount,
            toDelete,
          };
        },
      ),
    );
  }

  private async resolveDateField(collectionName: string) {
    const collection = this.mongoCollection(collectionName);

    for (const field of IfoodMaintenanceService.DATE_FIELDS) {
      const exists = await collection.findOne({ [field]: { $exists: true } });
      if (exists) {
        return field;
      }
    }

    return null;
  }

  private async existingCollectionNames() {
    const collections = await this.mongoDb()
      .listCollections({}, { nameOnly: true })
      .toArray();
    return new Set(collections.map((collection) => collection.name));
  }

  private normalizeCutoff(cutoff: Date | string) {
    const normalized = cutoff instanceof Date ? cutoff : new Date(cutoff);

    if (Number.isNaN(normalized.getTime())) {
      return IfoodMaintenanceService.DEFAULT_CUTOFF;
    }

    const minimumSafeDate = IfoodMaintenanceService.DEFAULT_CUTOFF;
    return normalized < minimumSafeDate ? normalized : minimumSafeDate;
  }

  private mongoCollection(collectionName: string) {
    return this.mongoDb().collection(collectionName);
  }

  private mongoDb() {
    return (this.dataSource.driver as any).queryRunner.databaseConnection.db();
  }
}
