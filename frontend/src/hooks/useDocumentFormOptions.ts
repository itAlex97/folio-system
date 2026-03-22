import { useEffect, useState } from 'react';
import { getDocumentFormOptions } from '../services/documentFormService';
import type { DocumentFormOptions } from '../types/formOptions';

export function useDocumentFormOptions() {
  const [options, setOptions] = useState<DocumentFormOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        const nextOptions = await getDocumentFormOptions();

        if (!isMounted) return;

        setOptions(nextOptions);
        setError('');
      } catch (loadError) {
        if (!isMounted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load form options.',
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    options,
    loading,
    error,
  };
}
