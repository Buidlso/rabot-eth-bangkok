import { type INestApplication, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from '@/app/app.module';
import { AllExceptionsFilter } from '@/filters';
import type { TConfig } from '@/infra/config';

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule);

  // enable cors
  app.enableCors({
    origin: '*',
    methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
    optionsSuccessStatus: 204,
  });

  // enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // security
  app.use(helmet());

  // cofiguration
  const configService = app.get<ConfigService<TConfig>>(ConfigService);

  // initialize exception handler
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  // initialize logger
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);

  // enable cookie parser
  const cookieSecret = configService.getOrThrow<string>('COOKIE_SECRET');
  app.use(cookieParser(cookieSecret));

  // enable compression
  app.use(compression());

  // http
  const port = configService.getOrThrow<string>('APP_HTTP_PORT');
  await app.listen(port);
  logger.log(`Api is running on port: ${port}`);
}

bootstrap();
