/** Central legal / compliance copy — override via env where noted. */
export const legalConfig = {
  serviceName: 'FreePeriod',
  /** Trading name or registered entity. Set LEGAL_OPERATOR_NAME in env to add a named operator. */
  operatorName: process.env.LEGAL_OPERATOR_NAME ?? 'FreePeriod',
  contactEmail: process.env.LEGAL_CONTACT_EMAIL ?? 'info@freeperiod.co.za',
  physicalAddress:
    process.env.LEGAL_PHYSICAL_ADDRESS ??
    '17 San Te Fe, Seaward Estates, Ballito, KwaZulu-Natal, South Africa',
  websiteUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://freeperiod.co.za',
  effectiveDate: '22 June 2026',
  /** Days after deletion request before permanent purge (Option C). */
  accountDeletionGraceDays: 30,
  /** Primary payment processor at launch (checkout uses Stripe). */
  paymentProcessor: 'Stripe',
  /** Supabase project database region (confirmed: eu-north-1). */
  supabaseRegion:
    process.env.LEGAL_SUPABASE_REGION ?? 'eu-north-1 (Stockholm, European Union)',
  /** Vercel serverless hosting region (confirmed: iad1). */
  vercelRegion: process.env.LEGAL_VERCEL_REGION ?? 'iad1 (Washington DC, United States)',
  /**
   * Combined disclosure for privacy policy international transfers section.
   * Override with LEGAL_DATA_REGION if you want a single custom string.
   */
  dataHostingRegion:
    process.env.LEGAL_DATA_REGION ??
    'Supabase database and file storage in eu-north-1 (Stockholm, EU); application hosting on Vercel in iad1 (Washington DC, US); AI providers (Anthropic, Google) and payment processing (Stripe) in the United States',
} as const;

export function operatorLabel(): string {
  const { serviceName, operatorName } = legalConfig;
  return operatorName === serviceName
    ? serviceName
    : `${serviceName} (operated by ${operatorName})`;
}
