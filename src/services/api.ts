import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LoginResponse,
  User,
  Order,
  MenuItem,
  Expense,
  EodReport,
} from "./types";

// Change this to your backend IP when testing on physical device
// For emulator: http://localhost:3000/api/v1
// For physical device: http://YOUR_COMPUTER_IP:3000/api/v1
export const API_BASE =
  "https://gambeshi-backend-production.up.railway.app/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Auto-attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("auth_user");
    }
    return Promise.reject(error);
  },
);

// ===== API Methods =====

// Auth
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },
  register: async (
    name: string,
    email: string,
    password: string,
    role: string,
  ): Promise<LoginResponse> => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
      role,
    });
    return response.data;
  },
  updatePushToken: async (expoPushToken: string): Promise<void> => {
    await api.patch("/auth/push-token", { expoPushToken });
  },
};

// Menu
export const menuApi = {
  getAll: async (): Promise<MenuItem[]> => {
    const response = await api.get("/menu");
    return response.data;
  },
  getGrouped: async (): Promise<Record<string, MenuItem[]>> => {
    const response = await api.get("/menu/grouped");
    return response.data;
  },
};

// Orders
export const ordersApi = {
  create: async (payload: {
    tableNumber?: string;
    customerNote?: string;
    items: { menuItemId: string; quantity: number; note?: string }[];
  }): Promise<Order> => {
    const response = await api.post("/orders", payload);
    return response.data;
  },
  getActive: async (): Promise<Order[]> => {
    const response = await api.get("/orders/active");
    return response.data;
  },
  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  updateStatus: async (id: string, status: string): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },
  markPaid: async (id: string, paymentMethod: string): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/pay`, { paymentMethod });
    return response.data;
  },
  getAll: async (
    limit?: number,
    offset?: number,
  ): Promise<{ data: Order[]; total: number }> => {
    const response = await api.get(
      `/orders?limit=${limit || 50}&offset=${offset || 0}`,
    );
    return response.data;
  },
};

// Expenses (Admin only)
export const expensesApi = {
  getAll: async (
    date?: string,
  ): Promise<{ expenses: Expense[]; total: number }> => {
    const url = date ? `/expenses?date=${date}` : "/expenses";
    const response = await api.get(url);
    return response.data;
  },
  create: async (payload: {
    name: string;
    amount: number;
    description?: string;
    date?: string;
  }): Promise<Expense> => {
    const response = await api.post("/expenses", payload);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },
};

// Reports (Admin only)
export const reportsApi = {
  generateEod: async (
    date: string,
    denominations: any,
  ): Promise<{ report: EodReport; summary: any }> => {
    const response = await api.post("/reports/eod", { date, denominations });
    return response.data;
  },
  getHistory: async (): Promise<EodReport[]> => {
    const response = await api.get("/reports/eod/history");
    return response.data;
  },
  getPdfUrl: (date: string): string => {
    return `${API_BASE}/reports/eod/${date}/pdf`;
  },
  deleteEod: async (reportId: string): Promise<void> => {
    await api.delete(`/reports/eod/${reportId}`);
  },
};
