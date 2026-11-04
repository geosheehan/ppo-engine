import { withCache } from '@api/cache';
import { localApi } from '@api/localApi';

export const ppoApi = withCache(localApi);
