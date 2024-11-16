import type { z } from 'zod';

import type {
  CreateBotReqTransformer,
  CreateBotResTransformer,
} from '../transformers/bot.transformer';

export type TCreateBotReqDto = z.infer<typeof CreateBotReqTransformer>;
export type TCreateBotResDto = z.infer<typeof CreateBotResTransformer>;
