import type { Provider } from '@nestjs/common';

import { CryptoHelper } from '@/helpers/crypto.helper';
import { PaginationHelper } from '@/helpers/pagination.helper';
import { SmartAccountHelper } from '@/helpers/smart-account.helper';
import { SmartContractHelper } from '@/helpers/smart-contract.helper';

export const Helpers: Provider[] = [
  CryptoHelper,
  PaginationHelper,
  SmartAccountHelper,
  SmartContractHelper,
];
