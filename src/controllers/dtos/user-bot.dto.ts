import type { z } from 'zod';

import type {
  CreateUserBotReqTransformer,
  CreateUserBotResTransformer,
} from '../transformers/user-bot.transformer';

export type TCreateUserBotReqDto = z.infer<typeof CreateUserBotReqTransformer>;
export type TCreateUserBotResDto = z.infer<typeof CreateUserBotResTransformer>;
