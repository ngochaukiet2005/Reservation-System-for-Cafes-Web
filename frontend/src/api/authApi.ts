import { httpClient } from './httpClient';

export const authApi = {
  login: (payload: unknown) => httpClient.post('/auth/login', payload),
  register: (payload: unknown) => httpClient.post('/auth/register', payload),
};
