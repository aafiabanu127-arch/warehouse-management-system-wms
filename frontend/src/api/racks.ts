import apiClient from './client';

export interface Rack {
  id: number;
  rack_code: string;
  capacity: number;
  zone: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getRacks = async (params?: { search?: string; page?: number; zone?: number }) => {
  const response = await apiClient.get<PaginatedResponse<Rack>>('/warehouses/racks/', { params });
  return response.data;
};

export const createRack = async (data: Partial<Rack>) => {
  const response = await apiClient.post<Rack>('/warehouses/racks/', data);
  return response.data;
};

export const updateRack = async (id: number, data: Partial<Rack>) => {
  const response = await apiClient.patch<Rack>(`/warehouses/racks/${id}/`, data);
  return response.data;
};

export const deleteRack = async (id: number) => {
  await apiClient.delete(`/warehouses/racks/${id}/`);
};