import apiClient from './client';

export interface Zone {
  id: number;
  name: string;
  capacity: number;
  warehouse: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getZones = async (params?: { search?: string; page?: number; warehouse?: number }) => {
  const response = await apiClient.get<PaginatedResponse<Zone>>('/warehouses/zones/', { params });
  return response.data;
};

export const createZone = async (data: Partial<Zone>) => {
  const response = await apiClient.post<Zone>('/warehouses/zones/', data);
  return response.data;
};

export const updateZone = async (id: number, data: Partial<Zone>) => {
  const response = await apiClient.patch<Zone>(`/warehouses/zones/${id}/`, data);
  return response.data;
};

export const deleteZone = async (id: number) => {
  await apiClient.delete(`/warehouses/zones/${id}/`);
};