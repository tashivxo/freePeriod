import { render, screen } from '@/lib/test-utils';
import { LegalDocumentShell } from './LegalDocumentShell';
import { legalConfig } from '@/lib/legal/config';

describe('LegalDocumentShell', () => {
  it('shows a single effective date line', () => {
    render(
      <LegalDocumentShell title="Privacy Policy" effectiveDate={legalConfig.effectiveDate}>
        <p>Body copy</p>
      </LegalDocumentShell>,
    );
    expect(screen.getByText(/effective date:/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(legalConfig.effectiveDate))).toBeInTheDocument();
    expect(screen.queryAllByText(/effective date:/i)).toHaveLength(1);
  });

  it('renders table of contents with anchor links', () => {
    render(
      <LegalDocumentShell
        title="Terms of Service"
        effectiveDate={legalConfig.effectiveDate}
        tableOfContents={[{ id: 'contact', title: '15. Contact' }]}
      >
        <h2 id="contact">15. Contact</h2>
      </LegalDocumentShell>,
    );
    const tocLink = screen.getByRole('link', { name: '15. Contact' });
    expect(tocLink).toHaveAttribute('href', '#contact');
    expect(screen.getByRole('navigation', { name: /table of contents/i })).toBeInTheDocument();
  });
});
