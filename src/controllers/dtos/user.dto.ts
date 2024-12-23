import type { z } from 'zod';

import type {
  CreateUserReqTransformer,
  CreateUserResTransformer,
  GetUserResTransformer,
} from '../transformers/user.transformer';

export type TCreatUserReqDto = z.infer<typeof CreateUserReqTransformer>;
export type TCreateUserResDto = z.infer<typeof CreateUserResTransformer>;

export type TGetUserResDto = z.infer<typeof GetUserResTransformer>;
