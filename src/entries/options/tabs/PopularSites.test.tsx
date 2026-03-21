import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PopularSites from './PopularSites';

import type { BlockRule } from '@/types/schema';

const createUniqueIdMock = vi.fn();

vi.mock('@/utils/createUniqueId', () => ({
  createUniqueId: () => createUniqueIdMock(),
}));

const removeRule = vi.fn(async () => {});
const addRule = vi.fn(async () => ({ ok: true }));

const existingRules: BlockRule[] = [
  {
    id: 'existing-rule-1',
    pattern: 'youtube.com',
    matchType: 'prefix',
    enabled: true,
    createdAt: '2026-03-06T00:00:00.000Z',
  },
  {
    id: 'existing-rule-2',
    pattern: 'youtu.be',
    matchType: 'prefix',
    enabled: true,
    createdAt: '2026-03-06T00:00:00.000Z',
  },
];

describe('PopularSites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createUniqueIdMock
      .mockReturnValueOnce('rule-1')
      .mockReturnValueOnce('rule-2')
      .mockReturnValueOnce('rule-3')
      .mockReturnValueOnce('rule-4');
  });

  it('filters the curated list and shows already-added sites as unavailable', () => {
    render(
      <PopularSites
        addRule={addRule}
        blockRules={existingRules}
        className='popular-sites'
        removeRule={removeRule}
      />,
    );

    expect(screen.getByText('Already added')).not.toBeNull();
    expect(screen.getByRole('checkbox', { name: /youtube/i }).hasAttribute('disabled')).toBe(true);

    fireEvent.change(screen.getByPlaceholderText('Search by site or domain'), {
      target: { value: 'reddit' },
    });

    expect(screen.getByText('Reddit')).not.toBeNull();
    expect(screen.queryByText('Netflix')).toBeNull();
  });

  it('adds selected sites and supports undoing the latest batch', async () => {
    render(
      <PopularSites
        addRule={addRule}
        blockRules={[]}
        className='popular-sites'
        removeRule={removeRule}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: /reddit/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /twitch/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Add 2 sites' }));

    await waitFor(() => {
      expect(addRule).toHaveBeenCalledTimes(2);
    });

    expect(addRule).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: 'rule-1', pattern: 'reddit.com', matchType: 'prefix' }),
    );
    expect(addRule).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: 'rule-2', pattern: 'twitch.tv', matchType: 'prefix' }),
    );
    expect(screen.getByText('Added 2 sites to your blocklist.')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    await waitFor(() => {
      expect(removeRule).toHaveBeenCalledTimes(2);
    });

    expect(removeRule).toHaveBeenCalledWith('rule-1');
    expect(removeRule).toHaveBeenCalledWith('rule-2');
  });
});
