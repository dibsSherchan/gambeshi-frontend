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
} from "react-native";
import { router } from "expo-router";
import { ordersApi } from "../../src/services/api";
import { Order } from "../../src/services/types";

export default function ReadyOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await ordersApi.getAll(100, 0);
      const ready = allOrders.data.filter((order) => order.status === "ready");
      setOrders(ready);
    } catch (error) {
      console.error("Failed to load ready orders:", error);
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

  const handlePayment = async (
    orderId: string,
    paymentMethod: "cash" | "phone_pay",
  ) => {
    setProcessingId(orderId);
    try {
      await ordersApi.markPaid(orderId, paymentMethod);
      Alert.alert("Success", "Order marked as paid");
      loadOrders();
    } catch (error) {
      console.error("Failed to process payment:", error);
      Alert.alert("Error", "Failed to process payment");
    } finally {
      setProcessingId(null);
    }
  };

  const showPaymentOptions = (order: Order) => {
    Alert.alert("Process Payment", `Total Amount: रू ${order.total_amount}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Cash", onPress: () => handlePayment(order.id, "cash") },
      {
        text: "Phone Pay",
        onPress: () => handlePayment(order.id, "phone_pay"),
      },
    ]);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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
        <View style={styles.readyBadge}>
          <Text style={styles.readyBadgeText}>Ready</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        <Text style={styles.itemsTitle}>ITEMS</Text>
        {item.order_items?.map((orderItem) => (
          <View key={orderItem.id} style={styles.orderItemRow}>
            <Text style={styles.orderItemName}>
              {orderItem.quantity}x {orderItem.item_name}
            </Text>
            <Text style={styles.orderItemPrice}>रू {orderItem.unit_price}</Text>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTime}>{formatTime(item.created_at)}</Text>
        <Text style={styles.orderTotal}>रू {item.total_amount}</Text>
      </View>

      <TouchableOpacity
        style={styles.payButton}
        onPress={() => showPaymentOptions(item)}
        disabled={processingId === item.id}
        activeOpacity={0.85}
      >
        {processingId === item.id ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.payButtonText}>Process Payment</Text>
        )}
      </TouchableOpacity>
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ready for Billing</Text>
        <View style={{ width: 40 }} />
      </View>

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
            <Text style={styles.sectionLabel}>AWAITING PAYMENT</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={styles.emptyTitle}>No Ready Orders</Text>
            <Text style={styles.emptyText}>
              Orders ready for billing will appear here
            </Text>
          </View>
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
    height: 180,
    backgroundColor: "#2C1A0E",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(245,239,230,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 20,
    color: "#F5EFE6",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F5EFE6",
    letterSpacing: 0.3,
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
  readyBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readyBadgeText: {
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 14,
    color: "#2C1A0E",
    fontWeight: "500",
  },
  orderItemPrice: {
    fontSize: 14,
    color: "#9A8070",
    fontWeight: "300",
  },

  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0E8E0",
    paddingTop: 14,
    marginBottom: 16,
  },
  orderTime: {
    fontSize: 12,
    color: "#C4B0A4",
  },
  orderTotal: {
    fontSize: 17,
    fontWeight: "700",
    color: "#B05C24",
  },

  payButton: {
    backgroundColor: "#B05C24",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
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
});
