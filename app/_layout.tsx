import React, { useEffect } from "react";
import { Stack, router, usePathname } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "../src/services/store/authStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, loadAuth } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    loadAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const publicRoutes = ["/login", "/register"];

    if (!user && !publicRoutes.includes(pathname)) {
      router.replace("/login");
    } else if (user && (pathname === "/login" || pathname === "/")) {
      // Redirect based on role
      const roleRoutes: Record<string, string> = {
        admin: "/admin",
        waiter: "/waiter",
        chef: "/chef",
      };
      router.replace(roleRoutes[user.role] || "/login");
    }
  }, [user, isLoading, pathname]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar barStyle="dark-content" />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthGate>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
