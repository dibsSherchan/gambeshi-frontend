// User Types
export type UserRole = "admin" | "waiter" | "chef";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

// Menu Types
export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  is_available: boolean;
}

// Order Types
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "ready"
  | "paid"
  | "cancelled";
export type PaymentMethod = "cash" | "phone_pay";

export interface OrderItem {
  id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  note?: string;
}

export interface Order {
  id: string;
  table_number?: string;
  customer_note?: string;
  status: OrderStatus;
  payment_method?: PaymentMethod;
  total_amount: number;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  waiter?: { id: string; name: string };
  order_items: OrderItem[];
}

// Expense Types
export interface Expense {
  id: string;
  name: string;
  amount: number;
  description?: string;
  date: string;
  created_at: string;
}

// Report Types
export interface Denomination {
  notes1000: number;
  notes500: number;
  notes100: number;
  notes50: number;
  notes20: number;
  notes10: number;
  notes5: number;
}

export interface EodReport {
  id: string;
  date: string;
  total_orders: number;
  cash_sales: number;
  phone_pay_sales: number;
  total_sales: number;
  total_expenses: number;
  sales_cash: number;
  denominations: Denomination;
  cash_counted: number;
  deno_cash: number;
  difference: number;
  is_profitable: boolean;
  created_at: string;
}

// Cart Types
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  note?: string;
}

// API Response Types
export interface LoginResponse {
  user: User;
  token: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}
