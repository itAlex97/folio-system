import type { Document } from '../types/document';

export function getDocuments(): Document[] {
  return [
    {
      id: 1,
      folio: 'Y2XX-26-BCN-0001',
      type: 'BCN',
      program: 'Y2XX',
      family: 'ENGINE',
      responsible: 'Juan Perez',
      status: 'OPEN',
      created: '2026-03-03',
    },
    {
      id: 2,
      folio: 'Y2XX-26-DCN-0003',
      type: 'DCN',
      program: 'Y2XX',
      family: 'BODY',
      responsible: 'Ana Lopez',
      status: 'CLOSED',
      created: '2026-03-02',
    },
  ];
}
