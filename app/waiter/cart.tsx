import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { ordersApi } from "../../src/services/api";
import { useCartStore } from "../../src/services/store/cartStore";

export default function CartScreen() {
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal } =
    useCartStore();
  const [tableNumber, setTableNumber] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const total = getCartTotal();

  const placeOrder = async () => {
    if (!tableNumber.trim()) {
      Alert.alert("Missing Info", "Please enter a table number.");
      return;
    }
    if (cart.length === 0) {
      Alert.alert("Cart Empty", "Add items to cart first.");
      return;
    }
    setSubmitting(true);
    try {
      const orderData = {
        tableNumber: tableNumber.trim(),
        customerNote: customerNote.trim() || undefined,
        items: cart.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          note: item.note,
        })),
      };
      const newOrder = await ordersApi.create(orderData);
      Alert.alert(
        "Order Placed! 🎉",
        `Order #${newOrder.id.slice(0, 8)} has been sent to the kitchen.`,
        [
          {
            text: "OK",
            onPress: () => {
              clearCart();
              setTableNumber("");
              setCustomerNote("");
              router.replace("/waiter");
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to place order",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderCartItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.menuItem.name}</Text>
        <Text style={styles.itemCategory}>{item.menuItem.category}</Text>
        {item.note ? <Text style={styles.itemNote}>📝 {item.note}</Text> : null}
      </View>

      <View style={styles.itemRight}>
        <Text style={styles.itemSubtotal}>
          रू {item.menuItem.price * item.quantity}
        </Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => removeFromCart(item.menuItem.id)}
          >
            <Text style={styles.removeBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (cart.length === 0) {
    return (
      <View style={styles.emptyScreen}>
        <View style={styles.topBand} />
        <View style={styles.emptyHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Order</Text>
          <View style={{ width: 42 }} />
        </View>

        <View style={styles.emptyBody}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Cart is empty</Text>
          <Text style={styles.emptyText}>
            Add items from the menu to get started
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.browseBtnText}>Browse Menu</Text>
            <Text style={styles.browseArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Your Order</Text>
          <Text style={styles.headerSub}>
            {cart.reduce((s, i) => s + i.quantity, 0)} item
            {cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      {/* Items list */}
      <FlatList
        data={cart}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderCartItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <View style={styles.detailsCard}>
            <Text style={styles.detailsLabel}>ORDER DETAILS</Text>

            <View style={styles.field}>
              <Text style={styles.inputLabel}>Table Number *</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🪑</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter table number"
                  placeholderTextColor="#C4B0A4"
                  value={tableNumber}
                  onChangeText={setTableNumber}
                  keyboardType="number-pad"
                  editable={!submitting}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.inputLabel}>Special Instructions</Text>
              <View style={[styles.inputWrap, styles.textAreaWrap]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Any requests for the kitchen…"
                  placeholderTextColor="#C4B0A4"
                  value={customerNote}
                  onChangeText={setCustomerNote}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!submitting}
                />
              </View>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>रू {total}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.placeOrderBtn,
                submitting && styles.placeOrderBtnDisabled,
              ]}
              onPress={placeOrder}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#F5EFE6" />
              ) : (
                <>
                  <Text style={styles.placeOrderBtnText}>Place Order</Text>
                  <Text style={styles.placeOrderArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.secureNote}>
              🔒 Order goes directly to the kitchen
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
  emptyScreen: {
    flex: 1,
    backgroundColor: "#F5EFE6",
  },
  topBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: "#2C1A0E",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  emptyHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  emptyBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 10,
    marginTop: -40,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 4 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2C1A0E",
  },
  emptyText: {
    fontSize: 14,
    color: "#9A8070",
    textAlign: "center",
    lineHeight: 20,
  },
  browseBtn: {
    marginTop: 12,
    backgroundColor: "#2C1A0E",
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  browseBtnText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#F5EFE6",
  },
  browseArrow: {
    fontSize: 18,
    color: "#F5EFE6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#2C1A0E",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(245,239,230,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 22,
    color: "#F5EFE6",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#F5EFE6",
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(245,239,230,0.4)",
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  cartItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C1A0E",
    marginBottom: 3,
  },
  itemCategory: {
    fontSize: 11,
    color: "#9A8070",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "500",
    marginBottom: 2,
  },
  itemNote: {
    fontSize: 12,
    color: "#B09080",
    marginTop: 2,
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  itemSubtotal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#B05C24",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FAF0E8",
    borderWidth: 1,
    borderColor: "#E8DDD5",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C1A0E",
    lineHeight: 18,
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C1A0E",
    minWidth: 22,
    textAlign: "center",
  },
  removeBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: {
    fontSize: 18,
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    marginTop: 8,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  detailsLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9A8070",
    letterSpacing: 1.2,
    marginBottom: 20,
  },
  field: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B4F3A",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF7F4",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E8DDD5",
    paddingHorizontal: 14,
  },
  textAreaWrap: {
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
    opacity: 0.5,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: "#2C1A0E",
  },
  textArea: {
    paddingVertical: 4,
    minHeight: 72,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 4,
    borderTopWidth: 1,
    borderTopColor: "#F0E8E0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C1A0E",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#B05C24",
  },
  placeOrderBtn: {
    backgroundColor: "#2C1A0E",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  placeOrderBtnDisabled: {
    opacity: 0.55,
  },
  placeOrderBtnText: {
    color: "#F5EFE6",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  placeOrderArrow: {
    color: "#F5EFE6",
    fontSize: 18,
  },
  secureNote: {
    textAlign: "center",
    fontSize: 11,
    color: "#C4B0A4",
    marginTop: 16,
  },
});
