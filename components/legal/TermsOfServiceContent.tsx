import Link from 'next/link';
import { legalConfig, operatorLabel } from '@/lib/legal/config';

export const termsTableOfContents = [
  { id: 'the-service', title: '1. The Service' },
  { id: 'eligibility', title: '2. Eligibility' },
  { id: 'accounts', title: '3. Accounts' },
  { id: 'subscriptions-and-billing', title: '4. Subscriptions and billing' },
  { id: 'your-content', title: '5. Your content' },
  { id: 'ai-generated-output', title: '6. AI-generated output' },
  { id: 'acceptable-use', title: '7. Acceptable use' },
  { id: 'intellectual-property', title: '8. Intellectual property' },
  { id: 'account-deletion', title: '9. Account deletion' },
  { id: 'disclaimers', title: '10. Disclaimers' },
  { id: 'limitation-of-liability', title: '11. Limitation of liability' },
  { id: 'indemnity', title: '12. Indemnity' },
  { id: 'governing-law', title: '13. Governing law' },
  { id: 'changes', title: '14. Changes' },
  { id: 'contact', title: '15. Contact' },
] as const;

export function TermsOfServiceContent() {
  const {
    serviceName,
    contactEmail,
    physicalAddress,
    websiteUrl,
    accountDeletionGraceDays,
    paymentProcessor,
  } = legalConfig;

  return (
    <>
      <section>
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of {serviceName}{' '}
          at <a href={websiteUrl}>{websiteUrl}</a> (the &quot;Service&quot;), operated by{' '}
          {operatorLabel()} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By creating an
          account or using the Service, you agree to these Terms and our{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      <section>
        <h2 id="the-service">1. The Service</h2>
        <p>
          {serviceName} is an AI-assisted lesson planning tool for teachers. You can describe lesson
          needs, upload curriculum documents or templates, generate structured lesson plans, edit
          them, and export them (for example as DOCX). Features vary by subscription plan.
        </p>
      </section>

      <section>
        <h2 id="eligibility">2. Eligibility</h2>
        <p>
          You must be at least 18 years old (or the age of majority in your jurisdiction) and able
          to form a binding contract. The Service is intended for educators and education
          professionals, not for use by students as end users.
        </p>
      </section>

      <section>
        <h2 id="accounts">3. Accounts</h2>
        <ul>
          <li>You are responsible for maintaining the confidentiality of your account credentials</li>
          <li>You must provide accurate registration information and keep it up to date</li>
          <li>You are responsible for all activity under your account</li>
          <li>
            You may sign up with email and password or Google OAuth. We only request the Google
            profile information needed to authenticate you
          </li>
          <li>Notify us promptly at <a href={`mailto:${contactEmail}`}>{contactEmail}</a> if you suspect unauthorised access</li>
        </ul>
      </section>

      <section>
        <h2 id="subscriptions-and-billing">4. Subscriptions and billing</h2>
        <ul>
          <li>
            <strong>Free plan:</strong> limited monthly lesson generations using our free-tier AI
            model
          </li>
          <li>
            <strong>Paid plans (Pro, Pro+):</strong> additional features and higher or unlimited
            generation limits as described on our <Link href="/pricing">Pricing</Link> page
          </li>
          <li>
            Paid subscriptions are billed through <strong>{paymentProcessor}</strong>. By
            subscribing, you also agree to {paymentProcessor}&apos;s terms where applicable
          </li>
          <li>
            Prices, features, and plan limits may change with reasonable notice. Changes apply to
            future billing periods unless otherwise stated
          </li>
          <li>
            You may cancel a paid subscription through {paymentProcessor}&apos;s customer portal or
            by contacting us. Cancellation stops future charges; access continues until the end of
            the current billing period unless otherwise stated
          </li>
          <li>
            Free trials, if offered, convert to paid plans unless cancelled before the trial ends
          </li>
          <li>Refunds are handled at our discretion except where required by applicable law</li>
        </ul>
      </section>

      <section>
        <h2 id="your-content">5. Your content</h2>
        <ul>
          <li>
            <strong>Ownership:</strong> You retain ownership of lesson plans, uploads, and other
            content you create or upload (&quot;Your Content&quot;)
          </li>
          <li>
            <strong>Licence to us:</strong> You grant us a limited, non-exclusive licence to host,
            process, reproduce, and display Your Content solely to operate and improve the Service
            (including sending relevant text to AI providers to generate lesson plans for you)
          </li>
          <li>
            <strong>Responsibility:</strong> You are solely responsible for Your Content and for
            ensuring you have the rights to upload and use any materials you provide
          </li>
          <li>
            <strong>No student PII:</strong> Do not upload unnecessary personal information about
            students or third parties. You are responsible for compliance with school policies and
            applicable education privacy laws
          </li>
        </ul>
      </section>

      <section>
        <h2 id="ai-generated-output">6. AI-generated output</h2>
        <ul>
          <li>
            Lesson plans are generated by artificial intelligence (Google Gemini on the free plan;
            Anthropic Claude on paid plans). Output may be inaccurate, incomplete, or unsuitable for
            your specific context
          </li>
          <li>
            AI output is a <strong>draft</strong> for your professional review. You are solely
            responsible for verifying accuracy, curriculum alignment, safeguarding, and suitability
            before use in the classroom
          </li>
          <li>
            We do not guarantee that generated content meets any particular curriculum standard,
            inspection requirement, or institutional policy
          </li>
          <li>
            Due to the nature of AI, similar outputs may be generated for different users. We do not
            guarantee uniqueness
          </li>
        </ul>
      </section>

      <section>
        <h2 id="acceptable-use">7. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose or in violation of any applicable law</li>
          <li>Upload malware, illegal content, or material that infringes intellectual property rights</li>
          <li>Attempt to reverse engineer, scrape, or abuse the Service or its APIs beyond permitted use</li>
          <li>Circumvent usage limits, authentication, or plan restrictions</li>
          <li>Share account credentials or resell access without our written permission</li>
          <li>Use the Service to generate harmful, discriminatory, or explicit content</li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate these Terms or pose a risk to the
          Service or other users.
        </p>
      </section>

      <section>
        <h2 id="intellectual-property">8. Intellectual property</h2>
        <p>
          The Service, including its software, design, branding, and documentation (excluding Your
          Content), is owned by us or our licensors and protected by intellectual property laws.
          These Terms do not grant you any rights to our trademarks or brand assets.
        </p>
      </section>

      <section>
        <h2 id="account-deletion">9. Account deletion</h2>
        <p>
          You may delete your account from <Link href="/settings">Settings</Link>. When you request
          deletion, your account is deactivated immediately and your personal data is scheduled for
          permanent deletion within {accountDeletionGraceDays} days, as described in our{' '}
          <Link href="/privacy">Privacy Policy</Link>. Export any lesson plans you wish to keep
          before deleting your account.
        </p>
      </section>

      <section>
        <h2 id="disclaimers">10. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
          OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE
          SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT AI OUTPUT WILL BE ACCURATE OR COMPLETE.
        </p>
      </section>

      <section>
        <h2 id="limitation-of-liability">11. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WE AND OUR SUPPLIERS WILL NOT BE LIABLE
          FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
          PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE OR AI-GENERATED CONTENT.
          OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS OR THE SERVICE IS LIMITED TO THE
          GREATER OF (A) THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS BEFORE THE CLAIM OR (B)
          USD $100.
        </p>
        <p>
          Some jurisdictions do not allow certain limitations; in those cases, our liability is
          limited to the fullest extent permitted by law.
        </p>
      </section>

      <section>
        <h2 id="indemnity">12. Indemnity</h2>
        <p>
          You agree to indemnify and hold us harmless from claims, damages, and expenses (including
          reasonable legal fees) arising from Your Content, your use of the Service, or your
          violation of these Terms or applicable law.
        </p>
      </section>

      <section>
        <h2 id="governing-law">13. Governing law</h2>
        <p>
          These Terms are governed by the laws of the Republic of South Africa, without regard to
          conflict-of-law principles. You agree to submit to the exclusive jurisdiction of the
          courts of South Africa for disputes arising from these Terms, except where mandatory
          consumer protection laws in your country require otherwise.
        </p>
      </section>

      <section>
        <h2 id="changes">14. Changes</h2>
        <p>
          We may modify these Terms from time to time. We will post the updated Terms on this page
          and update the &quot;Last updated&quot; date. Continued use after changes take effect
          constitutes acceptance of the revised Terms. Material changes may be notified by email or
          in-app notice.
        </p>
      </section>

      <section>
        <h2 id="contact">15. Contact</h2>
        <p>
          Questions about these Terms:
          <br />
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          <br />
          {physicalAddress}
        </p>
      </section>
    </>
  );
}
