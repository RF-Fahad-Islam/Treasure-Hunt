/**
 * Penalty calculation constants and utilities.
 * Rule:
 * - Normal: 1 point deduction for every 4 minutes (240 seconds).
 * - Help Mode: 1 point deduction for every 2 minutes (120 seconds).
 */

export const NORMAL_PENALTY_RATE_SECONDS = 240; // 4 minutes
export const HELP_PENALTY_RATE_SECONDS = 120;   // 2 minutes

/**
 * Calculates total penalty seconds for a given clue duration,
 * accounting for the period where help (location reveal) was active.
 * 
 * If help was active, the time after help counts double.
 */
export function calculateWeightedPenaltySeconds(
  startedAt: string | null,
  solvedAt: string | null,
  timeoutAckAt: string | null
): number {
  if (!startedAt) return 0;
  
  const start = new Date(startedAt).getTime();
  const end = solvedAt ? new Date(solvedAt).getTime() : Date.now();
  
  if (end <= start) return 0;

  if (!timeoutAckAt) {
    // Normal mode only
    return Math.floor((end - start) / 1000);
  }

  const ack = new Date(timeoutAckAt).getTime();

  if (ack <= start) {
    // Acknowledged from the beginning (shouldn't happen)
    return Math.floor((end - start) / 1000) * 2;
  }

  if (ack >= end) {
    // Acknowledged after solving
    return Math.floor((end - start) / 1000);
  }

  // Split into pre-ack and post-ack
  const preAckSeconds = Math.floor((ack - start) / 1000);
  const postAckSeconds = Math.floor((end - ack) / 1000);

  return preAckSeconds + (postAckSeconds * 2);
}

/**
 * Converts weighted penalty seconds into points.
 */
export function secondsToPenaltyPoints(seconds: number): number {
  return Math.floor(seconds / NORMAL_PENALTY_RATE_SECONDS);
}
