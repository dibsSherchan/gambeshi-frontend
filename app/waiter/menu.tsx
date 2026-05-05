import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { menuApi } from "../../src/services/api";
import { MenuItem } from "../../src/services/types";
import { useCartStore } from "../../src/services/store/cartStore";

export default function MenuScreen() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [groupedMenu, setGroupedMenu] = useState<Record<string, MenuItem[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { cart, addToCart, getCartCount, getCartTotal } = useCartStore();
  const cartItemCount = getCartCount();
  const cartTotal = getCartTotal();

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const grouped = await menuApi.getGrouped();
      setGroupedMenu(grouped);
      const allItems: MenuItem[] = [];
      Object.values(grouped).forEach((items) => allItems.push(...items));
      setMenuItems(allItems);
    } catch (error) {
      console.error("Failed to load menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredItems = () => {
    let items = menuItems;
    if (selectedCategory)
      items = items.filter((i) => i.category === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q),
      );
    }
    return items;
  };

  const categories = Object.keys(groupedMenu);
  const filteredItems = getFilteredItems();

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    const inCart = cart.find((c) => c.menuItem.id === item.id);
    return (
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => addToCart(item)}
        activeOpacity={0.85}
      >
        <View style={styles.menuCardInner}>
          <View style={styles.menuInfo}>
            <Text style={styles.menuName}>{item.name}</Text>
            <Text style={styles.menuCategory}>{item.category}</Text>
          </View>
          <View style={styles.menuRight}>
            <Text style={styles.menuPrice}>रू {item.price}</Text>
            <View style={[styles.addBtn, inCart ? styles.addBtnActive : null]}>
              <Text style={styles.addBtnText}>
                {inCart ? `${inCart.quantity}` : "+"}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#B05C24" />
        <Text style={styles.loadingText}>Loading menu…</Text>
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
          <Text style={styles.headerTitle}>Menu</Text>
          <Text style={styles.headerSub}>
            {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/waiter/cart")}
          style={styles.cartBtn}
        >
          <Text style={styles.cartBtnIcon}>🛒</Text>
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search dishes…"
          placeholderTextColor="#C4B0A4"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catList}
        contentContainerStyle={styles.catContent}
        data={["All", ...categories]}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const isAll = item === "All";
          const active = isAll
            ? selectedCategory === null
            : selectedCategory === item;
          return (
            <TouchableOpacity
              style={[styles.catChip, active && styles.catChipActive]}
              onPress={() =>
                setSelectedCategory(
                  isAll ? null : selectedCategory === item ? null : item,
                )
              }
            >
              <Text
                style={[styles.catChipText, active && styles.catChipTextActive]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Menu list */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderMenuItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuList}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptyText}>
              Try a different search or category
            </Text>
          </View>
        }
      />

      {/* Floating cart bar */}
      {cartItemCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCartBar}
          onPress={() => router.push("/waiter/cart")}
          activeOpacity={0.9}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCountBubble}>
              <Text style={styles.floatingCountText}>{cartItemCount}</Text>
            </View>
            <Text style={styles.floatingCartLabel}>View Order</Text>
          </View>
          <Text style={styles.floatingCartTotal}>रू {cartTotal}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5EFE6",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5EFE6",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#9A8070",
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
    letterSpacing: 0.5,
  },
  cartBtn: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cartBtnIcon: { fontSize: 24 },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: "#B05C24",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#F5EFE6",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#E8DDD5",
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: { fontSize: 16, marginRight: 8, opacity: 0.5 },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: "#2C1A0E",
  },
  clearIcon: {
    fontSize: 14,
    color: "#C4B0A4",
    paddingLeft: 8,
  },
  catList: {
    marginTop: 14,
    maxHeight: 48,
  },
  catContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E8DDD5",
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: "#2C1A0E",
    borderColor: "#2C1A0E",
  },
  catChipText: {
    fontSize: 13,
    color: "#6B4F3A",
    fontWeight: "500",
  },
  catChipTextActive: {
    color: "#F5EFE6",
    fontWeight: "600",
  },
  menuList: {
    padding: 16,
    paddingBottom: 110,
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  menuCardInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  menuInfo: { flex: 1 },
  menuName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C1A0E",
    marginBottom: 4,
  },
  menuCategory: {
    fontSize: 11,
    color: "#9A8070",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "500",
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#B05C24",
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2C1A0E",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnActive: {
    backgroundColor: "#B05C24",
  },
  addBtnText: {
    fontSize: 14,
    color: "#F5EFE6",
    fontWeight: "700",
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 64,
    gap: 8,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2C1A0E",
  },
  emptyText: {
    fontSize: 13,
    color: "#9A8070",
  },
  floatingCartBar: {
    position: "absolute",
    bottom: 28,
    left: 20,
    right: 20,
    backgroundColor: "#2C1A0E",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  floatingCartLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  floatingCountBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#B05C24",
    alignItems: "center",
    justifyContent: "center",
  },
  floatingCountText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F5EFE6",
  },
  floatingCartLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F5EFE6",
  },
  floatingCartTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E8C99A",
  },
});
