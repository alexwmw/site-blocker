import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SiteIdentity from './';

const identity = {
  host: 'reddit.com',
  path: '/r/typescript',
  label: 'reddit.com/r/typescript',
  faviconSources: ['https://example.com/favicon-primary.ico', 'https://example.com/favicon-secondary.ico'],
};

describe('SiteIdentity', () => {
  it('renders host and path text', () => {
    render(<SiteIdentity identity={identity} />);

    expect(screen.getByText('reddit.com')).not.toBeNull();
    expect(screen.getByText('/r/typescript')).not.toBeNull();
  });

  it('tries the next favicon source before falling back to the generic icon', () => {
    const { container } = render(<SiteIdentity identity={identity} />);

    const firstImage = container.querySelector('img');
    expect(firstImage?.getAttribute('src')).toBe('https://example.com/favicon-primary.ico');

    fireEvent.error(firstImage!);

    const secondImage = container.querySelector('img');
    expect(secondImage?.getAttribute('src')).toBe('https://example.com/favicon-secondary.ico');

    fireEvent.error(secondImage!);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByLabelText('reddit.com/r/typescript')).not.toBeNull();
  });

  it('renders the fallback label when no host is available', () => {
    render(
      <SiteIdentity
        identity={{
          host: null,
          path: '',
          label: 'Unknown site',
          faviconSources: [],
        }}
      />,
    );

    expect(screen.getByText('Unknown site')).not.toBeNull();
  });
});
