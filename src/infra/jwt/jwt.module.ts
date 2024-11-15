import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule as NestJwtModule, JwtService } from '@nestjs/jwt';

import type { TConfig } from '../config';

@Global()
@Module({
  imports: [
    NestJwtModule.registerAsync({
      useFactory: (configService: ConfigService<TConfig>) => ({
        global: true,
        secretOrPrivateKey: configService.getOrThrow<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtService],
  exports: [JwtService],
})
export class JwtModule {}
