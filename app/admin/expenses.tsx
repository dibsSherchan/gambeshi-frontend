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
  TextInput,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { expensesApi } from "../../src/services/api";
import { Expense } from "../../src/services/types";

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, [selectedDate]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expensesApi.getAll(selectedDate);
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error("Failed to load expenses:", error);
      Alert.alert("Error", "Failed to load expenses");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadExpenses();
  };

  const handleAddExpense = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter expense name");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.alert("Error", "Please enter valid amount");
      return;
    }

    setSubmitting(true);
    try {
      await expensesApi.create({
        name: formData.name.trim(),
        amount: parseFloat(formData.amount),
        description: formData.description.trim() || undefined,
        date: selectedDate,
      });
      Alert.alert("Success", "Expense added successfully");
      setModalVisible(false);
      setFormData({ name: "", amount: "", description: "" });
      loadExpenses();
    } catch (error) {
      Alert.alert("Error", "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = (expenseId: string, expenseName: string) => {
    Alert.alert("Delete Expense", `Delete "${expenseName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await expensesApi.delete(expenseId);
            Alert.alert("Success", "Expense deleted");
            loadExpenses();
          } catch {
            Alert.alert("Error", "Failed to delete expense");
          }
        },
      },
    ]);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const renderExpenseItem = ({
    item,
    index,
  }: {
    item: Expense;
    index: number;
  }) => (
    <>
      {index > 0 && <View style={styles.divider} />}
      <View style={styles.actionRow}>
        <View style={styles.actionIconWrap}>
          <Text style={styles.actionIcon}>💸</Text>
        </View>
        <View style={styles.actionTextGroup}>
          <Text style={styles.actionTitle}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.actionDesc}>{item.description}</Text>
          ) : null}
        </View>
        <Text style={styles.expenseAmount}>
          रू {item.amount.toLocaleString()}
        </Text>
        <TouchableOpacity
          onPress={() => handleDeleteExpense(item.id, item.name)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.welcomeLabel}>Manage</Text>
          <Text style={styles.welcomeName}>Expenses</Text>
        </View>
        <TouchableOpacity
          style={styles.addIconBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addIconText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Date + summary pill row */}
      <View style={styles.pillRow}>
        <TouchableOpacity
          style={styles.datePill}
          onPress={() => {
            Alert.alert("Change Date", "Enter date (YYYY-MM-DD)", [
              { text: "Cancel", style: "cancel" },
              {
                text: "OK",
                onPress: (date: any) => setSelectedDate(date || selectedDate),
              },
            ]);
          }}
        >
          <Text style={styles.datePillText}>📅 {selectedDate}</Text>
        </TouchableOpacity>
        <Text style={styles.countText}>{expenses.length} items</Text>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseItem}
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
          /* Total card */
          <View style={styles.totalCard}>
            <Text style={styles.sectionLabel}>TOTAL EXPENSES TODAY</Text>
            <Text style={styles.totalAmount}>
              रू {totalExpenses.toLocaleString()}
            </Text>
            <Text style={styles.totalNote}>Recorded for {selectedDate}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.card}>
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💰</Text>
              <Text style={styles.emptyTitle}>No Expenses Yet</Text>
              <Text style={styles.emptyText}>
                Tap + to add expenses for {selectedDate}
              </Text>
            </View>
          </View>
        }
        ListFooterComponent={
          expenses.length > 0 ? (
            <View style={[styles.card, { marginBottom: 32 }]}>
              <Text style={styles.sectionLabel}>ALL EXPENSES</Text>
              {expenses.map((item, index) => (
                <View key={item.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.actionRow}>
                    <View style={styles.actionIconWrap}>
                      <Text style={styles.actionIcon}>💸</Text>
                    </View>
                    <View style={styles.actionTextGroup}>
                      <Text style={styles.actionTitle}>{item.name}</Text>
                      {item.description ? (
                        <Text style={styles.actionDesc}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.expenseAmount}>
                      रू {item.amount.toLocaleString()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteExpense(item.id, item.name)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Add Expense Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Expense</Text>
            <Text style={styles.modalSubtitle}>
              Record a new expense for {selectedDate}
            </Text>

            <Text style={styles.inputLabel}>Expense Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Vegetables, Transport…"
              placeholderTextColor="#C4B0A4"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <Text style={styles.inputLabel}>Amount (रू)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0"
              placeholderTextColor="#C4B0A4"
              value={formData.amount}
              onChangeText={(text) =>
                setFormData({ ...formData, amount: text })
              }
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Additional notes…"
              placeholderTextColor="#C4B0A4"
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitModalButton]}
                onPress={handleAddExpense}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitModalButtonText}>Add Expense</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5EFE6" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5EFE6",
  },
  listContent: { flexGrow: 1, paddingBottom: 48 },

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
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(245,239,230,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { fontSize: 20, color: "rgba(245,239,230,0.8)" },
  headerTextGroup: { flex: 1 },
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
  addIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#B05C24",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addIconText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F5EFE6",
    lineHeight: 28,
  },

  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  datePill: {
    backgroundColor: "rgba(245,239,230,0.12)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  datePillText: {
    fontSize: 12,
    color: "rgba(245,239,230,0.7)",
    letterSpacing: 0.4,
  },
  countText: {
    fontSize: 11,
    color: "rgba(245,239,230,0.4)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  /* Total card */
  totalCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#2C1A0E",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9A8070",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#F5EFE6",
    marginBottom: 4,
  },
  totalNote: {
    fontSize: 12,
    color: "rgba(245,239,230,0.4)",
    fontWeight: "300",
  },

  /* White card */
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },

  divider: { height: 1, backgroundColor: "#F0E8E0", marginVertical: 16 },

  actionRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: "#FAF0E8",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: { fontSize: 22 },
  actionTextGroup: { flex: 1 },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2C1A0E",
    marginBottom: 2,
  },
  actionDesc: { fontSize: 12, color: "#9A8070", fontWeight: "300" },
  expenseAmount: { fontSize: 15, fontWeight: "700", color: "#EF4444" },
  deleteButton: { padding: 6 },
  deleteButtonText: { fontSize: 18 },

  /* Empty */
  emptyContainer: { alignItems: "center", paddingVertical: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 14 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C1A0E",
    marginBottom: 6,
  },
  emptyText: { fontSize: 13, color: "#9A8070", textAlign: "center" },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(44,26,14,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5D5C5",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2C1A0E",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#9A8070",
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9A8070",
    letterSpacing: 1,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#FAF5F0",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDE0D4",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#2C1A0E",
    marginBottom: 16,
  },
  textArea: { height: 80, textAlignVertical: "top" },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalButton: { flex: 1, padding: 16, borderRadius: 14, alignItems: "center" },
  cancelModalButton: { backgroundColor: "#F5EFE6" },
  cancelModalButtonText: { color: "#9A8070", fontSize: 15, fontWeight: "600" },
  submitModalButton: {
    backgroundColor: "#B05C24",
    shadowColor: "#B05C24",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitModalButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
