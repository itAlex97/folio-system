import { useEffect, useState } from 'react';
import { getDocumentById } from '../services/documentService';
import type { Document } from '../types/document';

export function useDocument(id: number | null) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    if (id === null) {
      setLoading(false);
      setError('Invalid document id.');
      return () => {
        isMounted = false;
      };
    }

    async function loadDocument() {
      try {
        const nextDocument = await getDocumentById(id as number);

        if (!isMounted) return;

        setDocument(nextDocument);
        setError('');
      } catch (loadError) {
        if (!isMounted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load the document.',
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadDocument();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return {
    document,
    loading,
    error,
  };
}
