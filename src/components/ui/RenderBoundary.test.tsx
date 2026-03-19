import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import RenderBoundary from './RenderBoundary';

describe('RenderBoundary', () => {
  it('renders a small loading spinner while data is unresolved', () => {
    const { container } = render(
      <RenderBoundary
        data={null}
        error={null}
      >
        <div>Ready</div>
      </RenderBoundary>,
    );

    expect(container.querySelector('span')).toBeTruthy();
    expect(screen.queryByText('Ready')).toBeNull();
  });

  it('renders an inline error surface when an error is present', () => {
    render(
      <RenderBoundary
        data={null}
        error={new Error('Failed to load rules.')}
      >
        <div>Ready</div>
      </RenderBoundary>,
    );

    expect(screen.getByRole('alert').textContent).toContain('Failed to load rules.');
  });

  it('renders children when data is ready', () => {
    render(
      <RenderBoundary
        data={{ ready: true }}
        error={null}
      >
        <div>Ready</div>
      </RenderBoundary>,
    );

    expect(screen.getByText('Ready')).not.toBeNull();
  });
});
