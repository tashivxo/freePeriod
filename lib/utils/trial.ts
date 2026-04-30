export function getTrialEndDate(trialStart: Date): Date {
  const end = new Date(trialStart);
  end.setDate(end.getDate() + 30);
  return end;
}

export function isTrialActive(trialEnd: string | null): boolean {
  if (!trialEnd) return false;
  return new Date(trialEnd) > new Date();
}

export function getTrialDaysRemaining(trialEnd: string | null): number {
  if (!trialEnd) return 0;
  const diff = new Date(trialEnd).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
