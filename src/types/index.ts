// ================================================================
// PINOLAPP - TIPOS TYPESCRIPT GLOBALES
// ================================================================

export type UserRole = 'customer' | 'restaurant_owner' | 'driver' | 'admin';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

export type RestaurantCategory =
  | 'restaurant'
  | 'fast_food'
  | 'pharmacy'
  | 'market'
  | 'bakery'
  | 'drinks';

export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  role: UserRole;
  address: string;
  address_lat: number;
  address_lng: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  logo_url: string;
  cover_url: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  category: RestaurantCategory;
  rating: number;
  total_reviews: number;
  delivery_time_min: number;
  delivery_time_max: number;
  delivery_fee: number;
  min_order: number;
  is_open: boolean;
  is_active: boolean;
  opening_time: string;
  closing_time: string;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  is_available: boolean;
  is_featured: boolean;
  preparation_time: number;
  calories: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  vehicle_type: 'motorcycle' | 'bicycle' | 'car';
  license_plate: string;
  is_available: boolean;
  is_online: boolean;
  current_lat: number;
  current_lng: number;
  rating: number;
  total_deliveries: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  notes?: string;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  neighborhood: string;
  reference: string;
  lat: number;
  lng: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  restaurant_id: string;
  driver_id: string | null;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  delivery_address: DeliveryAddress;
  payment_method: PaymentMethod;
  payment_status: 'pending' | 'paid' | 'refunded';
  notes: string;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string;
  created_at: string;
  updated_at: string;
  restaurant?: Restaurant;
  customer?: Profile;
  driver?: Driver;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes: string;
  created_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  restaurant_id: string;
  driver_id: string | null;
  restaurant_rating: number;
  driver_rating: number | null;
  comment: string;
  created_at: string;
}

export interface Promotion {
  id: string;
  restaurant_id: string;
  menu_item_id: string | null;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  menu_item?: MenuItem;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'info' | 'order_update' | 'promotion' | 'system';
  is_read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}

// Cart types
export interface CartItem extends OrderItem {
  restaurant_id: string;
}

export interface CartState {
  items: CartItem[];
  restaurant_id: string | null;
  restaurant_name: string | null;
  delivery_fee: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
  getItemCount: () => number;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
