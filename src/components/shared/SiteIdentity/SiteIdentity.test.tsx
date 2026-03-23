import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SiteIdentity from './';

const identity = {
  host: 'reddit.com',
  path: '/r/typescript',
  label: 'reddit.com/r/typescript',
  faviconSrc: 'https://example.com/favicon.ico',
};

describe('SiteIdentity', () => {
  it('renders host and path text', () => {
    render(<SiteIdentity identity={identity} />);

    expect(screen.getByText('reddit.com')).not.toBeNull();
    expect(screen.getByText('/r/typescript')).not.toBeNull();
  });

  it('falls back to the generic icon when the favicon fails to load', () => {
    const { container } = render(<SiteIdentity identity={identity} />);

    const image = container.querySelector('img');
    expect(image).toBeTruthy();

    fireEvent.error(image!);

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
          faviconSrc: null,
        }}
      />,
    );

    expect(screen.getByText('Unknown site')).not.toBeNull();
  });
});
