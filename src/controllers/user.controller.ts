import type { GetAccountBalanceReply } from '@ankr.com/ankr.js';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { UserService } from '@/services/user.service';

import type { TCreateUserResDto, TGetUserResDto } from './dtos/user.dto';
import { TCreatUserReqDto } from './dtos/user.dto';
import {
  CreateUserReqTransformer,
  CreateUserResTransformer,
  GetUserResTransformer,
} from './transformers/user.transformer';

@Controller('users')
export class UserController {
  constructor(private readonly _userService: UserService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createUser(
    @Body() dto: TCreatUserReqDto
  ): Promise<TCreateUserResDto> {
    const { name, email, walletAddress, uid } =
      await CreateUserReqTransformer.parseAsync(dto);
    const user = await this._userService.create(
      uid,
      walletAddress,
      email,
      name
    );
    return await CreateUserResTransformer.parseAsync(user);
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  public async getUser(@Param('id') id: string): Promise<TGetUserResDto> {
    const user = await this._userService.findById(id);
    return await GetUserResTransformer.parseAsync(user);
  }

  @HttpCode(HttpStatus.OK)
  @Get('all-balances-by-address')
  public async getAllBalancesByAddress(
    @Query('walletAddress') walletAddress: string
  ): Promise<GetAccountBalanceReply> {
    const balances =
      await this._userService.getAllBalancesByAddress(walletAddress);
    return balances;
  }
}
