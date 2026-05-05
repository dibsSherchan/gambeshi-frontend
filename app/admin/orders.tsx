import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { ordersApi } from "../../src/services/api";
import { Order } from "../../src/services/types";

export default function AllOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const statusOptions = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Ready", value: "ready" },
    { label: "Paid", value: "paid" },
    { label: "Cancelled", value: "cancelled" },
  ];

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getAll(200, 0);
      setOrders(response.data);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getFilteredOrders = () => {
    let filtered = [...orders];
    if (selectedStatus !== "all") {
      filtered = filtered.filter((order) => order.status === selectedStatus);
    }
    if (selectedDate) {
      filtered = filtered.filter(
        (order) => order.created_at.split("T")[0] === selectedDate,
      );
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          (order.table_number &&
            order.table_number.toLowerCase().includes(query)),
      );
    }
    return filtered;
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculateTotalRevenue = () => {
    const paidOrders = getFilteredOrders().filter((o) => o.status === "paid");
    return paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() =>
        router.push({
          pathname: "/waiter/order-details",
          params: { orderId: item.id },
        })
      }
      activeOpacity={0.85}
    >
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
        {item.order_items?.slice(0, 2).map((orderItem) => (
          <Text key={orderItem.id} style={styles.orderItemText}>
            {orderItem.quantity}x {orderItem.item_name}
          </Text>
        ))}
        {item.order_items?.length > 2 && (
          <Text style={styles.moreItems}>
            +{item.order_items.length - 2} more items
          </Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTime}>{formatDateTime(item.created_at)}</Text>
        <Text style={styles.orderTotal}>रू {item.total_amount}</Text>
      </View>
    </TouchableOpacity>
  );

  const filteredOrders = getFilteredOrders();
  const totalRevenue = calculateTotalRevenue();

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
        <Text style={styles.headerTitle}>All Orders</Text>
        <TouchableOpacity
          style={styles.filterIconBtn}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={styles.filterIconText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Search + Summary */}
      <View style={styles.searchCard}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order ID or table…"
          placeholderTextColor="#C4B0A4"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Orders</Text>
            <Text style={styles.summaryValue}>{filteredOrders.length}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Revenue</Text>
            <Text style={styles.summaryValue}>
              रू {totalRevenue.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredOrders}
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
          filteredOrders.length > 0 ? (
            <Text style={styles.sectionLabel}>ORDER HISTORY</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptyText}>Try changing your filters</Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Orders</Text>

            <Text style={styles.filterLabel}>STATUS</Text>
            <View style={styles.statusFilterContainer}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusFilterChip,
                    selectedStatus === option.value &&
                      styles.statusFilterChipActive,
                  ]}
                  onPress={() => setSelectedStatus(option.value)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.statusFilterChipText,
                      selectedStatus === option.value &&
                        styles.statusFilterChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>DATE (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="e.g., 2026-05-04"
              placeholderTextColor="#C4B0A4"
              value={selectedDate}
              onChangeText={setSelectedDate}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.clearButton]}
                onPress={() => {
                  setSelectedStatus("all");
                  setSelectedDate("");
                  setFilterModalVisible(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 20,
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
  filterIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(245,239,230,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterIconText: {
    fontSize: 18,
  },

  searchCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  searchInput: {
    backgroundColor: "#F5EFE6",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#2C1A0E",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#F0E8E0",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#9A8070",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B05C24",
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
  orderItemText: {
    fontSize: 14,
    color: "#2C1A0E",
    fontWeight: "500",
    marginBottom: 5,
  },
  moreItems: {
    fontSize: 12,
    color: "#C4B0A4",
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
  orderTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B05C24",
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(44,26,14,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2C1A0E",
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9A8070",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  statusFilterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  statusFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5EFE6",
  },
  statusFilterChipActive: {
    backgroundColor: "#B05C24",
  },
  statusFilterChipText: {
    fontSize: 13,
    color: "#9A8070",
    fontWeight: "500",
  },
  statusFilterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  dateInput: {
    backgroundColor: "#F5EFE6",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#2C1A0E",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  clearButton: {
    backgroundColor: "#F5EFE6",
    borderWidth: 1.5,
    borderColor: "#D4C0B0",
  },
  clearButtonText: {
    color: "#9A6050",
    fontSize: 15,
    fontWeight: "500",
  },
  applyButton: {
    backgroundColor: "#B05C24",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
