import { Children, isValidElement, type ReactNode } from 'react';
import RootLayout from '@/app/layout';

jest.mock(
  '@vercel/analytics/next',
  () => ({
    Analytics: function Analytics() {
      return <div data-testid="vercel-analytics" />;
    },
  }),
  { virtual: true },
);

jest.mock('@/lib/i18n/server', () => ({
  readLocaleCookie: jest.fn(async () => 'en'),
}));

const { Analytics } = jest.requireMock('@vercel/analytics/next') as {
  Analytics: () => ReactNode;
};

function findElementsByType(node: ReactNode, type: unknown): ReturnType<typeof Children.toArray> {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement(child)) return [];
    const matches = child.type === type ? [child] : [];
    const nested = (child.props as { children?: ReactNode }).children;
    return [...matches, ...findElementsByType(nested, type)];
  });
}

describe('root layout analytics', () => {
  it('renders the Vercel Analytics component at the end of body', async () => {
    const tree = await RootLayout({ children: <div>page</div> });

    expect(isValidElement(tree) && tree.type === 'html').toBe(true);
    const analytics = findElementsByType(tree, Analytics);
    expect(analytics).toHaveLength(1);

    const html = tree as { props: { children?: ReactNode } };
    const body = Children.toArray(html.props.children).find(
      (child) => isValidElement(child) && child.type === 'body',
    );
    expect(isValidElement(body)).toBe(true);

    const bodyChildren = Children.toArray(
      (body as { props: { children?: ReactNode } }).props.children,
    );
    const last = bodyChildren[bodyChildren.length - 1];
    expect(isValidElement(last) && last.type === Analytics).toBe(true);
  });
});
