export interface Product {
  id: number;
  category: number;
  name: string;
  sku: string;
  description: string;
  unit_volume: number;
  unit_weight: number;
  unit_price: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}