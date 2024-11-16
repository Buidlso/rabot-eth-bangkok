import { Injectable } from '@nestjs/common';

import type { TPaginated } from '@/domain';

@Injectable()
export class PaginationHelper {
  public paginate<T>(
    results: T[],
    count: number,
    page: number,
    size: number,
    total?: number,
    totalOpen?: number
  ): TPaginated<T> {
    const lastPage = Math.ceil(count / size);
    return {
      page,
      size,
      count,
      lastPage,
      total,
      totalOpen,
      results,
    };
  }
}
