import { useEffect, useState } from 'react';
import { getDocuments } from '../services/documentService';
import type { Document, DocumentStatus, DocumentType } from '../types/document';

interface DocumentQuery {
  search?: string;
  type?: DocumentType;
  program?: string;
  status?: DocumentStatus | '';
  modelYear?: string;
  phase?: string;
}

export function useDocuments(query: DocumentQuery = {}) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { search, type, program, status, modelYear, phase } = query;

  useEffect(() => {
    let isMounted = true;

    async function loadDocuments() {
      try {
        setLoading(true);

        const nextDocuments = await getDocuments({
          search,
          type,
          program,
          status,
          modelYear,
          phase,
        });

        if (!isMounted) return;

        setDocuments(nextDocuments);
        setError('');
      } catch (loadError) {
        if (!isMounted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load documents.',
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadDocuments();

    return () => {
      isMounted = false;
    };
  }, [modelYear, phase, program, search, status, type]);

  return {
    documents,
    loading,
    error,
  };
}
