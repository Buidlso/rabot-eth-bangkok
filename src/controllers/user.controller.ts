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
  @Get('all-balances-by-address')
  public async getAllBalancesByAddress(
    @Query('walletAddress') walletAddress: string
  ): Promise<any> {
    const balances =
      await this._userService.getAllBalancesByAddress(walletAddress);
    return balances;
  }

  @HttpCode(HttpStatus.OK)
  @Get(':walletAddress')
  public async getUserByWalletAddress(
    @Param('walletAddress') walletAddress: string
  ): Promise<TGetUserResDto> {
    const user = await this._userService.findByWalletAddress(walletAddress);
    return await GetUserResTransformer.parseAsync(user);
  }
}
