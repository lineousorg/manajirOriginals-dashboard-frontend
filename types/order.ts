// Order status enum
export enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

// User interface (nested in Order)
export interface OrderUser {
  id: number;
  email: string;
}

// Address interface (nested in Order)
export interface OrderAddress {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// Product interface (nested in OrderItem)
export interface OrderProduct {
  id: number;
  name: string;
  slug: string;
}

// Variant interface (nested in OrderItem)
export interface OrderVariant {
  id: number;
  sku: string;
  price: string;
  stock: number;
  productId: number;
  createdAt: string;
  updatedAt: string;
  product: OrderProduct;
}

// Order item interface
export interface OrderItem {
  id: number;
  orderId: number;
  variantId: number;
  quantity: number;
  price: string;
  variant: OrderVariant;
}

export interface OrderPagination {
  hasNext: boolean;
  hasPrevious: boolean;
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}

// Order interface (matches API response)
export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  paymentMethod: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  user: OrderUser;
  guestUser: { id: number; email: string; name: string; phone: string } | null;
  items?: OrderItem[];
  addressId?: number;
  address?: OrderAddress;
  pagination?: OrderPagination;
  orderNumber: null | number
}

// Input types for updating order status
export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

// API Response wrapper types
export type ApiResponse<T> = {
  message: string;
  status: "success" | "error";
  data: T;
};

export type OrdersApiResponse = ApiResponse<Order[]>;
export type OrderApiResponse = ApiResponse<Order>;
