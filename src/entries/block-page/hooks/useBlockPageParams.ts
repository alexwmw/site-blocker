import { useEffect, useState } from 'react';

export type BlockPageSearchParams = {
  ruleIds: string[] | null;
  patternHost: string | null;
  patternPath: string | null;
  matchType: string | null;
  targetUrl: string | null;
};

const useBlockPageParams = () => {
  const [params, setParams] = useState<BlockPageSearchParams | null>(null);
  useEffect(() => {
    const queryString = window.location.search;
    const p = new URLSearchParams(queryString);

    setParams({
      ruleIds: p
        .get('ruleIds')
        ?.split(',')
        .filter((ruleId) => ruleId.length > 0) ?? null,
      patternHost: p.get('patternHost'),
      patternPath: p.get('patternPath'),
      matchType: p.get('matchType'),
      targetUrl: p.get('targetUrl'),
    });
  }, []);

  return (
    params ?? {
      ruleIds: null,
      patternHost: null,
      patternPath: null,
      matchType: null,
      targetUrl: null,
    }
  );
};

export default useBlockPageParams;
