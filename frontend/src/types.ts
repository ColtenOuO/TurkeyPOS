export interface ProductOption {
  id: string;
  name: string;
  price_delta: number;
  is_required: boolean;
}

export interface Product {
  id: string;
  name: string;
  base_price: number;
  options: ProductOption[];
}

export interface Category {
  id: string;
  name: string;
  products: Product[];
}

export interface CartItem extends Product {
  quantity: number;
  selected_option_ids: string[];
  total_unit_price: number;
}

export interface OrderItemOptionBackend {
  option_name: string;
  price_delta: number;
}

export interface OrderItemBackend {
  product_name: string;
  quantity: number;
  unit_price: number;
  selected_options: OrderItemOptionBackend[];
}

export interface Order {
  id: string;
  table_number: string | null;
  total_price: number;
  status: string;
  created_at: string;
  items: OrderItemBackend[];
}