/** Central legal / compliance copy — override via env where noted. */
export const legalConfig = {
  serviceName: 'FreePeriod',
  /** Trading name or registered entity. Set LEGAL_OPERATOR_NAME in env to add a named operator. */
  operatorName: process.env.LEGAL_OPERATOR_NAME ?? 'FreePeriod',
  contactEmail: process.env.LEGAL_CONTACT_EMAIL ?? 'hello@freeperiod.co.za',
  physicalAddress:
    process.env.LEGAL_PHYSICAL_ADDRESS ??
    '17 San Te Fe, Seaward Estates, Ballito, KwaZulu-Natal, South Africa',
  websiteUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://freeperiod.co.za',
  effectiveDate: '22 June 2026',
  /** Days after deletion request before permanent purge (Option C). */
  accountDeletionGraceDays: 30,
  /** Primary payment processor at launch (checkout uses Stripe). */
  paymentProcessor: 'Stripe',
  /**
   * Where user data is primarily hosted. Set LEGAL_DATA_REGION in env after checking
   * Supabase Dashboard → Project Settings → General (e.g. "United States (us-east-1)").
   */
  dataHostingRegion:
    process.env.LEGAL_DATA_REGION ??
    'the United States and other regions where our infrastructure providers operate',
} as const;

export function operatorLabel(): string {
  const { serviceName, operatorName } = legalConfig;
  return operatorName === serviceName
    ? serviceName
    : `${serviceName} (operated by ${operatorName})`;
}
