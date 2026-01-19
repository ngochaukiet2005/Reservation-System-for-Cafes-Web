import { httpClient } from './httpClient';

export interface Table {
  id: number;
  capacity: number;
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
  capacity: number;
}

export interface UpdateTablePayload {
  capacity?: number;
  status_id?: string;
  disabled_reason?: string;
}

export const tableApi = {
  // Lấy danh sách bàn
  getAll: async () => {
    const response = await httpClient.get<{ message: string; data: Table[] }>('/tables');
    return response.data.data;
  },

  // Lấy danh sách trạng thái
  getStatuses: async () => {
    const response = await httpClient.get<{ message: string; data: Array<{ id: number; name: string }> }>('/tables/statuses');
    return response.data.data;
  },

  // Lấy thông tin 1 bàn
  getOne: async (id: number) => {
    const response = await httpClient.get<{ message: string; data: Table }>(`/tables/${id}`);
    return response.data.data;
  },

  // Tạo bàn mới
  create: async (payload: CreateTablePayload) => {
    const response = await httpClient.post<{ message: string; data: Table }>('/tables', payload);
    return response.data.data;
  },

  // Cập nhật bàn
  update: async (id: number, payload: UpdateTablePayload) => {
    const response = await httpClient.put<{ message: string; data: Table }>(`/tables/${id}`, payload);
    return response.data.data;
  },

  // Xóa bàn
  delete: async (id: number) => {
    const response = await httpClient.delete<{ message: string }>(`/tables/${id}`);
    return response.data;
  },
};
