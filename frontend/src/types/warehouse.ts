export interface Warehouse {
  id: number;
  name: string;
  location: string;
  total_capacity: number;
  available_capacity: number;
  manager: number | null;
manager_username?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}