import { httpClient } from './httpClient';

export const reservationApi = {
  create: (payload: unknown) => httpClient.post('/reservations', payload),
  list: () => httpClient.get('/reservations'),
};
