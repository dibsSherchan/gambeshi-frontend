import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../src/services/store/authStore";
import { ordersApi, expensesApi } from "../../src/services/api";

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    readyOrders: 0,
    todayExpenses: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const today = new Date().toISOString().split("T")[0];

      const todayOrders = await ordersApi.getAll(100, 0);
      const todayOrdersList = todayOrders.data.filter(
        (order) => order.created_at.split("T")[0] === today,
      );

      const activeOrders = await ordersApi.getActive();
      const pending = activeOrders.filter((o) => o.status === "pending").length;
      const ready = activeOrders.filter((o) => o.status === "ready").length;

      const revenue = todayOrdersList
        .filter((order) => order.status === "paid")
        .reduce((sum, order) => sum + order.total_amount, 0);

      const expenses = await expensesApi.getAll(today);

      setStats({
        todayOrders: todayOrdersList.length,
        todayRevenue: revenue,
        pendingOrders: pending,
        readyOrders: ready,
        todayExpenses: expenses.total,
      });
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const initials = user?.name?.charAt(0)?.toUpperCase() ?? "A";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B05C24" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#B05C24"]}
          tintColor="#B05C24"
        />
      }
    >
      {/* Dark top band */}
      <View style={styles.topBand} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.headerTextGroup}>
          <Text style={styles.welcomeLabel}>Good day,</Text>
          <Text style={styles.welcomeName}>{user?.name ?? "Admin"}</Text>
        </View>
        <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
          <Text style={styles.logoutIconText}>⎋</Text>
        </TouchableOpacity>
      </View>

      {/* Role + date pill row */}
      <View style={styles.pillRow}>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>⚙️ Admin</Text>
        </View>
        <Text style={styles.dateText}>{today}</Text>
      </View>

      {/* Stats Card */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>TODAY'S OVERVIEW</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>📊</Text>
            <Text style={styles.statValue}>{stats.todayOrders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>💰</Text>
            <Text style={styles.statValue}>
              रू {stats.todayRevenue.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>⏳</Text>
            <Text style={styles.statValue}>{stats.pendingOrders}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={styles.statValue}>{stats.readyOrders}</Text>
            <Text style={styles.statLabel}>Ready</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Expenses row */}
        <View style={styles.expenseRow}>
          <View>
            <Text style={styles.expenseTitle}>Today's Expenses</Text>
            <Text style={styles.expenseNote}>Total recorded today</Text>
          </View>
          <Text style={styles.expenseAmount}>
            रू {stats.todayExpenses.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Quick Actions Card */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push("/admin/orders")}
          activeOpacity={0.85}
        >
          <View style={styles.actionIconWrap}>
            <Text style={styles.actionIcon}>🍽️</Text>
          </View>
          <View style={styles.actionTextGroup}>
            <Text style={styles.actionTitle}>All Orders</Text>
            <Text style={styles.actionDesc}>View full order history</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push("/admin/expenses")}
          activeOpacity={0.85}
        >
          <View style={styles.actionIconWrap}>
            <Text style={styles.actionIcon}>💰</Text>
          </View>
          <View style={styles.actionTextGroup}>
            <Text style={styles.actionTitle}>Expenses</Text>
            <Text style={styles.actionDesc}>Add & manage expenses</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push("/admin/reports")}
          activeOpacity={0.85}
        >
          <View style={styles.actionIconWrap}>
            <Text style={styles.actionIcon}>📄</Text>
          </View>
          <View style={styles.actionTextGroup}>
            <Text style={styles.actionTitle}>EOD Reports</Text>
            <Text style={styles.actionDesc}>End of day reports</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push("/admin/ready-orders")}
          activeOpacity={0.85}
        >
          <View style={styles.actionIconWrap}>
            <Text style={styles.actionIcon}>✅</Text>
          </View>
          <View style={styles.actionTextGroup}>
            <Text style={styles.actionTitle}>Ready Orders</Text>
            <Text style={styles.actionDesc}>Process payments</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.secureNote}>🔒 Secure staff access only</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5EFE6",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5EFE6",
  },

  topBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    backgroundColor: "#2C1A0E",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 20,
    gap: 14,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#B05C24",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F5EFE6",
  },
  headerTextGroup: {
    flex: 1,
  },
  welcomeLabel: {
    fontSize: 12,
    color: "rgba(245,239,230,0.5)",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  welcomeName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F5EFE6",
    letterSpacing: 0.3,
  },
  logoutIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(245,239,230,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutIconText: {
    fontSize: 20,
    color: "rgba(245,239,230,0.7)",
  },

  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  rolePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(245,239,230,0.12)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  rolePillText: {
    fontSize: 12,
    color: "rgba(245,239,230,0.7)",
    letterSpacing: 0.4,
  },
  dateText: {
    fontSize: 11,
    color: "rgba(245,239,230,0.4)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9A8070",
    letterSpacing: 1.2,
    marginBottom: 18,
  },

  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: "#F0E8E0",
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2C1A0E",
  },
  statLabel: {
    fontSize: 10,
    color: "#9A8070",
    fontWeight: "300",
    letterSpacing: 0.3,
  },

  divider: {
    height: 1,
    backgroundColor: "#F0E8E0",
    marginVertical: 20,
  },

  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C1A0E",
    marginBottom: 3,
  },
  expenseNote: {
    fontSize: 12,
    color: "#9A8070",
    fontWeight: "300",
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#EF4444",
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FAF0E8",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    fontSize: 24,
  },
  actionTextGroup: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C1A0E",
    marginBottom: 3,
  },
  actionDesc: {
    fontSize: 12,
    color: "#9A8070",
    fontWeight: "300",
  },
  actionArrow: {
    fontSize: 20,
    color: "#B05C24",
  },

  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 4,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D4C0B0",
    backgroundColor: "transparent",
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9A6050",
    letterSpacing: 0.3,
  },
  secureNote: {
    textAlign: "center",
    fontSize: 11,
    color: "#C4B0A4",
    marginTop: 16,
  },
});
