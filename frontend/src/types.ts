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
  order_type: string;
  total_price: number;
  status: string;
  created_at: string;
  items: OrderItemBackend[];
  // 預定訂單才有值
  is_reservation: boolean;
  order_no: string | null;
  customer_name: string | null;
  customer_unit: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  pickup_time: string | null;
}

export interface Reservation {
  id: string;
  order_no: string | null;
  store_id: string | null;
  store_name: string | null;
  customer_name: string | null;
  customer_unit: string | null;
  customer_phone: string | null;
  order_type: string; // takeout | delivery
  delivery_address: string | null;
  pickup_time: string | null;
  total_price: number;
  status: string; // reserved | pending | completed | cancelled
  created_at: string;
  items: OrderItemBackend[];
}

/** 顧客通過姓名 + 電話驗證後可查詢的訂單資料 */
export interface ReservationPublic {
  order_no: string | null;
  store_name: string | null;
  customer_name: string | null;
  customer_unit: string | null;
  customer_phone: string | null;
  order_type: string;
  delivery_address: string | null;
  pickup_time: string | null;
  total_price: number;
  status: string;
  created_at: string;
  items: OrderItemBackend[];
}

export interface ReservationSummary {
  store_id: string | null;
  store_name: string | null;
  total_orders: number;
  total_sales: number;
  takeout_orders: number;
  delivery_orders: number;
  reservations: Reservation[];
}