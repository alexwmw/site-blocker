import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Rules from './';

import type { BlockRule, Schedule } from '@/types/schema';

const removeRule = vi.fn(async () => {});
const updateRule = vi.fn(async () => {});

const schedule: Schedule = {
  enabled: false,
  windows: [],
};

const rule: BlockRule = {
  id: 'rule-1',
  pattern: 'example.com',
  matchType: 'prefix',
  enabled: true,
  createdAt: '2026-03-06T00:00:00.000Z',
};

describe('Rules', () => {
  it('does not render the empty state before rules resolve', () => {
    render(
      <Rules
        className='rules'
        blockRules={null}
        removeRule={removeRule}
        schedule={schedule}
        updateRule={updateRule}
        onClickEditSchedule={vi.fn()}
      />,
    );

    expect(screen.queryByText('No rules yet.')).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('renders the empty state only after rules are ready and truly empty', () => {
    render(
      <Rules
        className='rules'
        blockRules={[]}
        removeRule={removeRule}
        schedule={schedule}
        updateRule={updateRule}
        onClickEditSchedule={vi.fn()}
      />,
    );

    expect(screen.getByText('No rules yet.')).not.toBeNull();
    expect(screen.getByText('Add rules from the popup to start blocking distracting sites.')).not.toBeNull();
  });

  it('renders rule content once rules are ready', () => {
    render(
      <Rules
        className='rules'
        blockRules={[rule]}
        removeRule={removeRule}
        schedule={schedule}
        updateRule={updateRule}
        onClickEditSchedule={vi.fn()}
      />,
    );

    expect(screen.getByText('example.com')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Remove' })).not.toBeNull();
  });
});
