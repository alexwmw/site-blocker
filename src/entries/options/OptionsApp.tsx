import useBlockRules from '../../hooks/useBlockRules';

const OptionsApp = () => {
  const { blockRules } = useBlockRules();
  return (
    <div>
      <p>Hello, world!</p>
      {blockRules?.length ? <h2>Block Rules</h2> : <h2>No Block Rules</h2>}
      <ul>
        {blockRules?.map((rule) => (
          <li key={rule.id}>{rule.pattern}</li>
        ))}
      </ul>
    </div>
  );
};

export default OptionsApp;
