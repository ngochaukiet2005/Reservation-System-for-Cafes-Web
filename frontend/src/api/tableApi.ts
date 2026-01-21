import { httpClient } from './httpClient';

export interface Table {
  id: number;
  name: string;
  capacity: number;
  type?: string;
  status: {
    id: number;
    name: string;
  };
  status_id: number;
  disabled_reason?: string;
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTablePayload {
  name: string;
  capacity: number;
  type?: string;
}

export interface UpdateTablePayload {
  capacity?: number;
  status_id?: number;
  disabled_reason?: string;

  name?: string;
  type?: string;
}

export const tableApi = {
  getAll: async () => {
    const response = await httpClient.get<{ message: string; data: Table[] }>('/tables');
    return response.data.data;
  },

  getStatuses: async () => {
    const response = await httpClient.get<{ message: string; data: Array<{ id: number; name: string }> }>('/tables/statuses');
    return response.data.data;
  },

  getOne: async (id: number) => {
    const response = await httpClient.get<{ message: string; data: Table }>(`/tables/${id}`);
    return response.data.data;
  },

  create: async (payload: CreateTablePayload) => {
    const response = await httpClient.post<{ message: string; data: Table }>('/tables', payload);
    return response.data.data;
  },

  update: async (id: number, payload: UpdateTablePayload) => {
    const response = await httpClient.put<{ message: string; data: Table }>(`/tables/${id}`, payload);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await httpClient.delete<{ message: string }>(`/tables/${id}`);
    return response.data;
  },
};
