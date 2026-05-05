import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../src/services/store/authStore";
import { ordersApi } from "../../src/services/api";
import { Order } from "../../src/services/types";

export default function ChefDashboard() {
  const { user, logout } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getActive();
      setOrders(data);
    } catch (error) {
      console.error("Failed to load orders:", error);
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#F59E0B";
      case "confirmed":
        return "#3B82F6";
      case "ready":
        return "#10B981";
      case "paid":
        return "#8B5CF6";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "confirmed":
        return "Confirmed";
      case "ready":
        return "Ready";
      case "paid":
        return "Paid";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleStatusUpdate = async (orderId: string, currentStatus: string) => {
    let newStatus = "";
    let message = "";

    if (currentStatus === "pending") {
      newStatus = "confirmed";
      message = "Confirm this order?";
    } else if (currentStatus === "confirmed") {
      newStatus = "ready";
      message = "Mark this order as ready?";
    } else {
      return;
    }

    Alert.alert("Update Status", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            await ordersApi.updateStatus(orderId, newStatus);
            loadOrders();
            Alert.alert(
              "Success",
              `Order marked as ${getStatusText(newStatus)}`,
            );
          } catch (error) {
            console.error("Failed to update status:", error);
            Alert.alert("Error", "Failed to update order status");
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const initials = user?.name?.charAt(0)?.toUpperCase() ?? "C";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.id.slice(0, 8)}</Text>
          <Text style={styles.tableNumber}>
            Table {item.table_number || "Takeaway"}
          </Text>
          <Text style={styles.waiterName}>
            Waiter: {item.waiter?.name || "Unknown"}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        <Text style={styles.itemsTitle}>ITEMS</Text>
        {item.order_items?.map((orderItem) => (
          <View key={orderItem.id} style={styles.orderItemRow}>
            <Text style={styles.orderItemName}>
              {orderItem.quantity}x {orderItem.item_name}
            </Text>
            {!!orderItem.note && (
              <Text style={styles.orderItemNote}>{orderItem.note}</Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTime}>{formatTime(item.created_at)}</Text>
        <View style={styles.footerButtons}>
          {item.status === "pending" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => handleStatusUpdate(item.id, item.status)}
              activeOpacity={0.85}
            >
              <Text style={styles.actionButtonText}>Confirm Order</Text>
            </TouchableOpacity>
          )}
          {item.status === "confirmed" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.readyButton]}
              onPress={() => handleStatusUpdate(item.id, item.status)}
              activeOpacity={0.85}
            >
              <Text style={styles.actionButtonText}>Mark Ready</Text>
            </TouchableOpacity>
          )}
          {item.status === "ready" && (
            <View style={styles.readyBadge}>
              <Text style={styles.readyBadgeText}>Waiting for billing</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B05C24" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Dark top band */}
      <View style={styles.topBand} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.headerTextGroup}>
          <Text style={styles.welcomeLabel}>Kitchen view,</Text>
          <Text style={styles.welcomeName}>{user?.name ?? "Chef"}</Text>
        </View>
        <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
          <Text style={styles.logoutIconText}>⎋</Text>
        </TouchableOpacity>
      </View>

      {/* Role + date pill row */}
      <View style={styles.pillRow}>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>🍳 Chef</Text>
        </View>
        <Text style={styles.dateText}>{today}</Text>
      </View>

      {/* Orders list */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.orderList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#B05C24"]}
            tintColor="#B05C24"
          />
        }
        ListHeaderComponent={
          orders.length > 0 ? (
            <Text style={styles.sectionLabel}>ACTIVE ORDERS</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🍳</Text>
            <Text style={styles.emptyTitle}>No Active Orders</Text>
            <Text style={styles.emptyText}>
              All caught up! Kitchen is ready.
            </Text>
          </View>
        }
        ListFooterComponent={
          orders.length > 0 ? (
            <>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.logoutBtnText}>Sign Out</Text>
              </TouchableOpacity>
              <Text style={styles.secureNote}>🔒 Secure staff access only</Text>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.logoutBtnText}>Sign Out</Text>
              </TouchableOpacity>
              <Text style={styles.secureNote}>🔒 Secure staff access only</Text>
            </>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5EFE6",
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
    paddingBottom: 20,
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

  orderList: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9A8070",
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 4,
  },

  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C1A0E",
  },
  tableNumber: {
    fontSize: 13,
    color: "#9A8070",
    fontWeight: "300",
    marginTop: 3,
  },
  waiterName: {
    fontSize: 12,
    color: "#C4B0A4",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  orderItems: {
    borderTopWidth: 1,
    borderTopColor: "#F0E8E0",
    paddingTop: 14,
    marginBottom: 14,
  },
  itemsTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9A8070",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  orderItemRow: {
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 14,
    color: "#2C1A0E",
    fontWeight: "500",
  },
  orderItemNote: {
    fontSize: 12,
    color: "#C4B0A4",
    marginLeft: 12,
    marginTop: 2,
    fontWeight: "300",
  },

  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0E8E0",
    paddingTop: 14,
  },
  orderTime: {
    fontSize: 12,
    color: "#C4B0A4",
  },
  footerButtons: {
    flex: 1,
    alignItems: "flex-end",
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  confirmButton: {
    backgroundColor: "#3B82F6",
  },
  readyButton: {
    backgroundColor: "#10B981",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  readyBadge: {
    backgroundColor: "#F5EFE6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  readyBadgeText: {
    color: "#9A8070",
    fontSize: 12,
    fontWeight: "500",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 48,
    alignItems: "center",
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C1A0E",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#9A8070",
    textAlign: "center",
    fontWeight: "300",
  },

  logoutBtn: {
    marginTop: 8,
    marginBottom: 0,
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
