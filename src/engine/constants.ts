import { PENALTY_SEVERITIES } from '@domain/constants';
import type { PenaltySeverity } from '@domain/types';

export const STRENGTH_SEVERITIES = new Set<PenaltySeverity>([
   PENALTY_SEVERITIES.MINOR,
   PENALTY_SEVERITIES.BENCH_MINOR,
   PENALTY_SEVERITIES.MAJOR,
   PENALTY_SEVERITIES.MATCH,
]);
