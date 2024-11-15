import 'express';

import type { TAuthUser } from '@/domain';

declare module 'express' {
  export interface Request {
    user?: TAuthUser;
  }
}
