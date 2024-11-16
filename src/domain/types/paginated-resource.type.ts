export type TPaginated<Resource = unknown> = {
  page: number;
  size: number;
  count: number;
  total?: number;
  totalOpen?: number;
  lastPage: number;
  results: Resource[];
};
