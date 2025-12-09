import { httpClient } from './httpClient';

export const tableApi = {
  create: (payload: unknown) => httpClient.post('/tables', payload),
  update: (id: number, payload: unknown) => httpClient.patch(`/tables/${id}`, payload),
};
