import { useCallback } from 'react';

import useBlockRules from '../../hooks/useBlockRules';
import type { BlockRule } from '../../types/schema';

const OptionsApp = () => {
  const { blockRules, removeRule } = useBlockRules();

  // Basic implementation for testing - allows easy viewing and removal of a stored rules
  const mapRules = useCallback(
    (rule: BlockRule) => {
      const handleRemove = () => {
        removeRule(rule.id).catch(console.error);
      };
      return (
        <li key={rule.id} className="options-page__rule">
          {rule.pattern}
          <button className="options-page__remove" onClick={handleRemove}>
            Remove
          </button>
        </li>
      );
    },
    [removeRule],
  );

  return (
    <div className="options-page">
      <h1>Site Blocker</h1>
      <p className="options-page__subtitle">Manage your active blocking rules.</p>
      {blockRules?.length ? <h2>Block Rules</h2> : <h2>No Block Rules</h2>}
      <ul className="options-page__rules">{blockRules?.map(mapRules)}</ul>
    </div>
  );
};

export default OptionsApp;
