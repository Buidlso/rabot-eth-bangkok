import type { z } from 'zod';

import type {
  CreateUserBotReqTransformer,
  CreateUserBotResTransformer,
  GetUserBotResTransformer,
  ListUserBotsResTransformer,
  WithdrawFromUserBotReqTransformer,
  WithdrawFromUserBotResTransformer,
} from '../transformers/user-bot.transformer';

export type TCreateUserBotReqDto = z.infer<typeof CreateUserBotReqTransformer>;
export type TCreateUserBotResDto = z.infer<typeof CreateUserBotResTransformer>;

export type TListUserBotsResDto = z.infer<typeof ListUserBotsResTransformer>;
export type TGetUserBotResDto = z.infer<typeof GetUserBotResTransformer>;

export type TWithdrawFromUserBotReqDto = z.infer<
  typeof WithdrawFromUserBotReqTransformer
>;
export type TWithdrawFromUserBotResDto = z.infer<
  typeof WithdrawFromUserBotResTransformer
>;
