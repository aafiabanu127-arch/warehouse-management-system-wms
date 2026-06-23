import apiClient from './client';

export async function register(data: {
  username: string;
  email: string;
  password: string;
  password2: string;
  phone?: string;
  department?: string;
}) {
  const response = await apiClient.post('/users/register/', data);
  return response.data;
}

export async function changePassword(data: {
  old_password: string;
  new_password: string;
  new_password2: string;
}) {
  const response = await apiClient.post('/users/change-password/', data);
  return response.data;
}

export async function requestPasswordReset(email: string) {
  const response = await apiClient.post('/users/password-reset/', { email });
  return response.data;
}

export async function confirmPasswordReset(data: {
  uid: string;
  token: string;
  new_password: string;
  new_password2: string;
}) {
  const response = await apiClient.post('/users/password-reset/confirm/', data);
  return response.data;
}

export async function getUsers(): Promise<{ id: number; username: string }[]> {
  const response = await apiClient.get('/users/');
  const data = response.data;
  return Array.isArray(data) ? data : data.results ?? [];
}
