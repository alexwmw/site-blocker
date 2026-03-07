import useBlockRules from '../../hooks/useBlockRules';
import useCreateRuleFromTab from '../../hooks/useCreateRuleFromTab';

const PopupApp = () => {
  const { activeTab, isSupported, createDomainPrefixRule, createPrefixUrlRule } = useCreateRuleFromTab();
  const { addRule } = useBlockRules();

  const handleAddDomainClick = () => {
    const rule = createDomainPrefixRule();
    if (rule) {
      addRule(rule).catch(console.error);
    }
  };

  const handleAddPathClick = () => {
    const rule = createPrefixUrlRule();
    if (rule) {
      addRule(rule).catch(console.error);
    }
  };

  return (
    <div>
      <button
        disabled={!activeTab || !isSupported}
        onClick={handleAddDomainClick}
      >
        Add Domain
      </button>
      <button
        disabled={!activeTab || !isSupported}
        onClick={handleAddPathClick}
      >
        Add Page
      </button>
    </div>
  );
};

export default PopupApp;
