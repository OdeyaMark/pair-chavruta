import { useEffect, useState } from 'react';
import { dashboard } from '@wix/dashboard';

export const useDashboardModalParams = <T>(allowEmpty = false): T | null => {
  const [params, setParams] = useState<T | null>(null);

  useEffect(() => {
    const observerResult = dashboard.observeState((receivedParams: T | null | undefined) => {
      if (receivedParams || allowEmpty) {
        setParams((receivedParams ?? null) as T | null);
      }
    });

    return () => observerResult?.disconnect?.();
  }, [allowEmpty]);

  return params;
};
