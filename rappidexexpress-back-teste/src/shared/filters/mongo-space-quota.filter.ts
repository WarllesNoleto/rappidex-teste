import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class MongoSpaceQuotaFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongoSpaceQuotaFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const message = String(exception?.message || exception || '');
    const isMongoQuotaError =
      exception?.name === 'MongoServerError' &&
      /space quota|writes are blocked|quota/i.test(message);

    if (!isMongoQuotaError) {
      throw exception;
    }

    this.logger.error(
      `MongoDB Atlas bloqueou gravações por limite de espaço: ${message}`,
    );

    const response = host.switchToHttp().getResponse<Response>();
    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'DatabaseStorageQuotaExceeded',
      message:
        'Não foi possível salvar agora porque o banco atingiu o limite de armazenamento. A equipe foi notificada; tente novamente após a limpeza ou aumento do plano do MongoDB Atlas.',
    });
  }
}
