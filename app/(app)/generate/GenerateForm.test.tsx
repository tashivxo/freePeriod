import { render, screen, waitFor } from '@/lib/test-utils';

// --- Mocks ---

const mockUpload = jest.fn().mockResolvedValue({
  data: { path: 'user-123/curriculum/syllabus.pdf' },
  error: null,
});
const mockRemove = jest.fn().mockResolvedValue({ data: null, error: null });

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    storage: {
      from: jest.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
      })),
    },
  })),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { GenerateForm } from './GenerateForm';

// --- Constants ---

const GRADES = [
  'Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
];

const defaults = { subject: 'Maths', grade: '9', curriculum: 'CAPS' };

// --- Tests ---

describe('GenerateForm', () => {
  const onSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- Rendering ----

  it('renders form heading', () => {
    render(<GenerateForm onSubmit={onSubmit} />);
    expect(
      screen.getByRole('heading', { name: /generate a lesson/i }),
    ).toBeInTheDocument();
  });

  // ---- Pre-filling defaults ----

  it('pre-fills subject from defaults', () => {
    render(<GenerateForm onSubmit={onSubmit} defaults={defaults} />);
    expect(screen.getByLabelText('Subject')).toHaveValue('Maths');
  });

  it('pre-fills grade from defaults', () => {
    render(<GenerateForm onSubmit={onSubmit} defaults={defaults} />);
    expect(screen.getByLabelText('Grade')).toHaveValue('9');
  });

  it('pre-fills curriculum from defaults', () => {
    render(<GenerateForm onSubmit={onSubmit} defaults={defaults} />);
    expect(screen.getByLabelText('Curriculum')).toHaveValue('CAPS');
  });

  // ---- Dropdowns ----

  it('renders grade dropdown with all options', () => {
    render(<GenerateForm onSubmit={onSubmit} />);
    for (const grade of GRADES) {
      expect(screen.getByRole('option', { name: grade })).toBeInTheDocument();
    }
  });

  it('renders duration dropdown with preset options and Custom', () => {
    render(<GenerateForm onSubmit={onSubmit} />);
    for (const label of ['30 min', '45 min', '60 min', '90 min', '120 min']) {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole('option', { name: /custom/i })).toBeInTheDocument();
  });

  it('shows custom duration input when Custom is selected', async () => {
    const { user } = render(<GenerateForm onSubmit={onSubmit} />);
    await user.selectOptions(screen.getByLabelText('Duration'), 'custom');
    expect(screen.getByLabelText(/custom duration/i)).toBeInTheDocument();
  });

  // ---- Teacher prompt ----

  it('renders teacher prompt textarea', () => {
    render(<GenerateForm onSubmit={onSubmit} />);
    expect(
      screen.getByLabelText(/any specific focus or requirements/i),
    ).toBeInTheDocument();
  });

  // ---- File upload zones ----

  it('renders curriculum document upload zone with accepted types', () => {
    render(<GenerateForm onSubmit={onSubmit} />);
    expect(screen.getByText('Curriculum Document')).toBeInTheDocument();
    const input = screen.getByLabelText(/upload curriculum document/i);
    expect(input).toHaveAttribute('accept', '.pdf,.docx,.xlsx,.jpg,.png');
  });

  it('renders school template upload zone with accepted types', () => {
    render(<GenerateForm onSubmit={onSubmit} />);
    expect(screen.getByText('School Template')).toBeInTheDocument();
    const input = screen.getByLabelText(/upload school template/i);
    expect(input).toHaveAttribute('accept', '.pdf,.docx,.xlsx');
  });

  it('shows file preview after uploading curriculum document', async () => {
    const { user } = render(<GenerateForm onSubmit={onSubmit} />);
    const file = new File(['content'], 'syllabus.pdf', {
      type: 'application/pdf',
    });

    await user.upload(
      screen.getByLabelText(/upload curriculum document/i),
      file,
    );

    await waitFor(() => {
      expect(screen.getByText('syllabus.pdf')).toBeInTheDocument();
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });
  });

  it('removes uploaded file when remove button is clicked', async () => {
    const { user } = render(<GenerateForm onSubmit={onSubmit} />);
    const file = new File(['content'], 'syllabus.pdf', {
      type: 'application/pdf',
    });

    await user.upload(
      screen.getByLabelText(/upload curriculum document/i),
      file,
    );

    await waitFor(() => {
      expect(screen.getByText('syllabus.pdf')).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: /remove syllabus\.pdf/i }),
    );

    expect(screen.queryByText('syllabus.pdf')).not.toBeInTheDocument();
  });

  // ---- Validation & submission ----

  it('disables Generate button when subject is empty', () => {
    render(<GenerateForm onSubmit={onSubmit} />);
    expect(screen.getByRole('button', { name: /generate/i })).toBeDisabled();
  });

  it('enables Generate button when subject is filled', async () => {
    const { user } = render(<GenerateForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('Subject'), 'Maths');
    expect(screen.getByRole('button', { name: /generate/i })).toBeEnabled();
  });

  it('calls onSubmit with form data when Generate is clicked', async () => {
    const { user } = render(
      <GenerateForm onSubmit={onSubmit} defaults={defaults} />,
    );

    await user.click(screen.getByRole('button', { name: /generate/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Maths',
        grade: '9',
        curriculum: 'CAPS',
        duration: 60,
        teacherPrompt: '',
        curriculumDocPath: null,
        templatePath: null,
      }),
    );
  });
});
