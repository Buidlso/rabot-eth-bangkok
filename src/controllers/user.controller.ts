import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { UserService } from '@/services/user.service';

import type { TCreateUserResDto } from './dtos/user.dto';
import { TCreatUserReqDto } from './dtos/user.dto';
import {
  CreateUserReqTransformer,
  CreateUserResTransformer,
} from './transformers/user.transformer';

@Controller('users')
export class UserController {
  constructor(private readonly _userService: UserService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createUser(
    @Body() dto: TCreatUserReqDto
  ): Promise<TCreateUserResDto> {
    const { name, email, walletAddress } =
      await CreateUserReqTransformer.parseAsync(dto);
    const user = await this._userService.create(email, walletAddress, name);
    return await CreateUserResTransformer.parseAsync(user);
  }
}
