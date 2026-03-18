import { getDocuments } from '../services/documentService';

export function useDocuments() {
  const documents = getDocuments();

  return {
    documents,
    loading: false,
  };
}
