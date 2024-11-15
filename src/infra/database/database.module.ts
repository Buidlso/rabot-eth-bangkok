import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import type { TConfig } from '../config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService<TConfig>) => ({
        type: 'postgres',
        host: configService.getOrThrow('POSTGRES_HOST'),
        port: configService.getOrThrow('POSTGRES_PORT'),
        database: configService.getOrThrow('POSTGRES_DB'),
        username: configService.getOrThrow('POSTGRES_USER'),
        password: configService.getOrThrow('POSTGRES_PASSWORD'),
        namingStrategy: new SnakeNamingStrategy(),
        autoLoadEntities: true,
        synchronize: false,
        entities: ['dist/src/domain/entities/**/*.entity.js'],
        migrations: ['dist/db/migrations/**/*.js'],
        cli: {
          entitiesDir: 'src/domain/entities',
          migrationsDir: 'db/migrations',
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {
  static forFeature(...entities: EntityClassOrSchema[]) {
    return TypeOrmModule.forFeature(entities);
  }
}
