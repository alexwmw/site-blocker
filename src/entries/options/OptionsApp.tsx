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
        <li key={rule.id}>
          {rule.pattern}
          <button onClick={handleRemove}>Remove</button>
        </li>
      );
    },
    [removeRule],
  );

  return (
    <div>
      <p>Hello, world!</p>
      {blockRules?.length ? <h2>Block Rules</h2> : <h2>No Block Rules</h2>}
      <ul>{blockRules?.map(mapRules)}</ul>
    </div>
  );
};

export default OptionsApp;
