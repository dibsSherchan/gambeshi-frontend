import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi } from "../api";
import { User, AuthState } from "../types";

interface AuthStore extends AuthState {
  // Actions
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
  setAuth: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  isLoading: true,

  // Load auth from storage (called on app start)
  loadAuth: async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const userStr = await AsyncStorage.getItem("auth_user");

      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({
          user,
          token,
          isLoading: false,
        });
        console.log("✅ Auth loaded from storage:", user.email);
      } else {
        set({
          user: null,
          token: null,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Failed to load auth:", error);
      set({ user: null, token: null, isLoading: false });
    }
  },

  // Login user
  login: async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const { user, token } = response;

      // Save to storage
      await AsyncStorage.setItem("auth_token", token);
      await AsyncStorage.setItem("auth_user", JSON.stringify(user));

      // Update state
      set({ user, token, isLoading: false });

      console.log("✅ Login successful:", user.email, "Role:", user.role);
      return { success: true };
    } catch (error: any) {
      console.error(
        "❌ Login failed:",
        error?.response?.data?.message || error.message,
      );
      return {
        success: false,
        error:
          error?.response?.data?.message || "Login failed. Please try again.",
      };
    }
  },

  // Set auth (used after registration)
  setAuth: async (user: User, token: string) => {
    await AsyncStorage.setItem("auth_token", token);
    await AsyncStorage.setItem("auth_user", JSON.stringify(user));
    set({ user, token, isLoading: false });
    console.log("✅ Auth set for:", user.email);
  },

  // Logout user
  logout: async () => {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("auth_user");
    set({ user: null, token: null, isLoading: false });
    console.log("👋 User logged out");
  },

  // Clear auth (alias for logout)
  clearAuth: async () => {
    const { logout } = get();
    await logout();
  },
}));
