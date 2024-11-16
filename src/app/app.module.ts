import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { Bot, Tx, User, UserBot } from '@/domain/entities';
import { ConfigModule } from '@/infra/config';
import { DatabaseModule } from '@/infra/database';
import { LoggerModule } from '@/infra/logger';

import { Adapters } from './adapters';
import { Controllers } from './controllers';
import { Helpers } from './helpers';
import { Repositories } from './repositories';
import { Services } from './services';
import { Strategies } from './strategies';
import { Subscribers } from './subscribers';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    DatabaseModule.forFeature(User, Bot, UserBot, Tx),
    EventEmitterModule.forRoot({
      global: true,
    }),
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 60000,
        maxRedirects: 5,
      }),
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [...Controllers],
  providers: [
    ...Helpers,
    ...Services,
    ...Strategies,
    ...Subscribers,
    ...Repositories,
    ...Adapters,
  ],
})
export class AppModule {}
