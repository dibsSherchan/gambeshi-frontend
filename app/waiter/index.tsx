import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../src/services/store/authStore";

export default function WaiterDashboard() {
  const { user, logout } = useAuthStore();

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

  const initials = user?.name?.charAt(0)?.toUpperCase() ?? "W";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
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
          <Text style={styles.welcomeName}>{user?.name ?? "Waiter"}</Text>
        </View>
        <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
          <Text style={styles.logoutIconText}>⎋</Text>
        </TouchableOpacity>
      </View>

      {/* Role + date pill row */}
      <View style={styles.pillRow}>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>🧾 Waiter</Text>
        </View>
        <Text style={styles.dateText}>{today}</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push("/waiter/menu")}
          activeOpacity={0.85}
        >
          <View style={styles.actionIconWrap}>
            <Text style={styles.actionIcon}>📋</Text>
          </View>
          <View style={styles.actionTextGroup}>
            <Text style={styles.actionTitle}>New Order</Text>
            <Text style={styles.actionDesc}>Browse menu & create an order</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Tip block inside card */}
        <View style={styles.tipRow}>
          <Text style={styles.tipEmoji}>💡</Text>
          <Text style={styles.tipText}>
            Tap <Text style={styles.tipBold}>New Order</Text> to pick items, set
            a table number, and send the order straight to the kitchen.
          </Text>
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Secure note */}
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

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FAF0E8",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    fontSize: 28,
  },
  actionTextGroup: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2C1A0E",
    marginBottom: 3,
  },
  actionDesc: {
    fontSize: 13,
    color: "#9A8070",
    fontWeight: "300",
  },
  actionArrow: {
    fontSize: 20,
    color: "#B05C24",
  },

  divider: {
    height: 1,
    backgroundColor: "#F0E8E0",
    marginVertical: 20,
  },

  tipRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  tipEmoji: {
    fontSize: 16,
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: "#9A8070",
    lineHeight: 19,
    fontWeight: "300",
  },
  tipBold: {
    fontWeight: "600",
    color: "#6B4F3A",
  },

  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 20,
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
