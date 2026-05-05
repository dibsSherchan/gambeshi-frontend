import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { reportsApi, expensesApi, ordersApi } from "../../src/services/api";
import * as Sharing from "expo-sharing";

interface Denomination {
  notes1000: number;
  notes500: number;
  notes100: number;
  notes50: number;
  notes20: number;
  notes10: number;
  notes5: number;
}

export default function ReportsScreen() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(false);
  const [reportHistory, setReportHistory] = useState<any[]>([]);
  const [showDenominationModal, setShowDenominationModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [denominations, setDenominations] = useState<Denomination>({
    notes1000: 0,
    notes500: 0,
    notes100: 0,
    notes50: 0,
    notes20: 0,
    notes10: 0,
    notes5: 0,
  });
  const [generating, setGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [editingDenominations, setEditingDenominations] =
    useState<Denomination>({
      notes1000: 0,
      notes500: 0,
      notes100: 0,
      notes50: 0,
      notes20: 0,
      notes10: 0,
      notes5: 0,
    });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadReportHistory();
  }, []);

  const loadReportHistory = async () => {
    try {
      const history = await reportsApi.getHistory();
      setReportHistory(history);
    } catch (error) {
      console.error("Failed to load report history:", error);
    }
  };

  const calculateDenominationTotal = (d: Denomination): number =>
    d.notes1000 * 1000 +
    d.notes500 * 500 +
    d.notes100 * 100 +
    d.notes50 * 50 +
    d.notes20 * 20 +
    d.notes10 * 10 +
    d.notes5 * 5;

  const fetchDailyData = async (date: string) => {
    setLoading(true);
    try {
      const ordersResponse = await ordersApi.getAll(500, 0);
      const allOrders = ordersResponse.data;
      const dailyOrders = allOrders.filter(
        (order) => order.created_at.split("T")[0] === date,
      );

      const cashSales = dailyOrders
        .filter((o) => o.status === "paid" && o.payment_method === "cash")
        .reduce((sum, o) => sum + o.total_amount, 0);

      const phonePaySales = dailyOrders
        .filter((o) => o.status === "paid" && o.payment_method === "phone_pay")
        .reduce((sum, o) => sum + o.total_amount, 0);

      const totalSales = cashSales + phonePaySales;
      const expensesData = await expensesApi.getAll(date);
      const totalExpenses = expensesData.total || 0;
      const salesCash = totalSales - totalExpenses;

      return {
        cashSales,
        phonePaySales,
        totalSales,
        totalExpenses,
        salesCash,
        ordersCount: dailyOrders.filter((o) => o.status === "paid").length,
      };
    } catch (error) {
      console.error("Failed to fetch daily data:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const showPreview = async () => {
    const data = await fetchDailyData(selectedDate);
    if (data) {
      setPreviewData(data);
      setShowDenominationModal(true);
    } else {
      Alert.alert("Error", "Failed to load daily data");
    }
  };

  const deleteEODReport = async (reportId: string, reportDate: string) => {
    Alert.alert(
      "Delete Report",
      `Are you sure you want to delete the EOD report for ${reportDate}?\n\nThis action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await reportsApi.deleteEod(reportId);
              Alert.alert(
                "Success",
                `EOD report for ${reportDate} has been deleted`,
              );
              loadReportHistory();
            } catch (error) {
              console.error("Failed to delete report:", error);
              Alert.alert("Error", "Failed to delete report");
            }
          },
        },
      ],
    );
  };

  const editEODReport = async (report: any) => {
    setEditingReport(report);
    const existingDenoms = report.denominations || {
      notes1000: 0,
      notes500: 0,
      notes100: 0,
      notes50: 0,
      notes20: 0,
      notes10: 0,
      notes5: 0,
    };
    setEditingDenominations(existingDenoms);
    setShowEditModal(true);
  };

  const updateEODReport = async () => {
    setEditing(true);
    try {
      await reportsApi.deleteEod(editingReport.id);
      await reportsApi.generateEod(editingReport.date, editingDenominations);

      Alert.alert(
        "Success",
        `EOD report for ${editingReport.date} has been updated`,
        [{ text: "OK" }],
      );

      setShowEditModal(false);
      setEditingReport(null);
      loadReportHistory();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to update report",
      );
    } finally {
      setEditing(false);
    }
  };

  const generateEODReport = async () => {
    const physicalCash = calculateDenominationTotal(denominations);

    if (physicalCash === 0 && previewData?.phonePaySales === 0) {
      Alert.alert("Error", "Please enter cash denominations");
      return;
    }

    setGenerating(true);
    try {
      const denoCash = physicalCash + previewData.phonePaySales;
      const difference = denoCash - previewData.salesCash;
      const isProfitable = difference >= 0;

      await reportsApi.generateEod(selectedDate, denominations);

      const profitMessage = isProfitable
        ? `✅ PROFIT: रू ${difference.toLocaleString()} extra found`
        : `❌ LOSS: रू ${Math.abs(difference).toLocaleString()} missing`;

      Alert.alert(
        "Report Generated",
        `${profitMessage}\n\nSales Cash: रू ${previewData.salesCash.toLocaleString()}\nDeno Cash: रू ${denoCash.toLocaleString()}\nDifference: रू ${Math.abs(difference).toLocaleString()}`,
        [
          { text: "View PDF", onPress: () => downloadPDF(selectedDate) },
          { text: "OK" },
        ],
      );

      setShowDenominationModal(false);
      loadReportHistory();
      resetDenominations();
      setPreviewData(null);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to generate report",
      );
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = async (date: string) => {
    try {
      const url = reportsApi.getPdfUrl(date);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${await require("../../src/services/api").api.defaults.headers.Authorization}`,
        },
      });
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(base64data, {
            mimeType: "application/pdf",
            dialogTitle: `EOD_Report_${date}.pdf`,
          });
        } else {
          Alert.alert("Error", "Sharing not available on this device");
        }
      };
    } catch {
      Alert.alert("Error", "Failed to download PDF");
    }
  };

  const resetDenominations = () =>
    setDenominations({
      notes1000: 0,
      notes500: 0,
      notes100: 0,
      notes50: 0,
      notes20: 0,
      notes10: 0,
      notes5: 0,
    });

  const renderDenominationInput = (
    label: string,
    field: keyof Denomination,
    value: number,
    onChange: (field: keyof Denomination, value: number) => void,
  ) => (
    <View style={styles.denominationRow}>
      <View style={styles.denomLabelWrap}>
        <Text style={styles.denominationLabel}>{label}</Text>
      </View>
      <TextInput
        style={styles.denominationInput}
        value={value.toString()}
        onChangeText={(text) => onChange(field, parseInt(text) || 0)}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor="#C4B0A4"
      />
    </View>
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const changeDate = () => {
    Alert.alert("Select Date", "Enter date (YYYY-MM-DD)", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: (date: any) => setSelectedDate(date || selectedDate),
      },
    ]);
  };

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.welcomeLabel}>End of Day</Text>
          <Text style={styles.welcomeName}>Reports</Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      {/* Pill row */}
      <View style={styles.pillRow}>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>📄 EOD</Text>
        </View>
        <Text style={styles.countText}>{reportHistory.length} reports</Text>
      </View>

      {/* Generate Card */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>GENERATE NEW REPORT</Text>

        <TouchableOpacity style={styles.actionRow} onPress={changeDate}>
          <View style={styles.actionIconWrap}>
            <Text style={styles.actionIcon}>📅</Text>
          </View>
          <View style={styles.actionTextGroup}>
            <Text style={styles.actionTitle}>Report Date</Text>
            <Text style={styles.actionDesc}>{selectedDate}</Text>
          </View>
          <Text style={styles.actionArrow}>✎</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.generateButton}
          onPress={showPreview}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.generateButtonText}>Preview & Generate</Text>
              <Text style={styles.generateArrow}>→</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* History Card */}
      <View style={[styles.card, { marginBottom: 32 }]}>
        <Text style={styles.sectionLabel}>REPORT HISTORY</Text>

        {reportHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📄</Text>
            <Text style={styles.emptyTitle}>No Reports Yet</Text>
            <Text style={styles.emptyText}>
              Generate your first EOD report above
            </Text>
          </View>
        ) : (
          reportHistory.map((report, index) => (
            <View key={report.id}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.historyRow}>
                {/* Top: icon + text + badge */}
                <View style={styles.historyTop}>
                  <View style={styles.actionIconWrap}>
                    <Text style={styles.actionIcon}>
                      {report.is_profitable ? "📈" : "📉"}
                    </Text>
                  </View>
                  <View style={styles.historyTextGroup}>
                    <Text style={styles.actionTitle}>
                      {formatDate(report.date)}
                    </Text>
                    <Text style={styles.actionDesc}>
                      {report.total_orders} orders · रू{" "}
                      {report.sales_cash?.toLocaleString()} sales cash
                    </Text>
                    <Text
                      style={[
                        styles.historyDiff,
                        { color: report.is_profitable ? "#22C55E" : "#EF4444" },
                      ]}
                    >
                      {report.is_profitable ? "▲ Profit" : "▼ Loss"} रू{" "}
                      {report.difference?.toLocaleString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.profitBadge,
                      {
                        backgroundColor: report.is_profitable
                          ? "rgba(34,197,94,0.12)"
                          : "rgba(239,68,68,0.12)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.profitBadgeText,
                        { color: report.is_profitable ? "#16A34A" : "#DC2626" },
                      ]}
                    >
                      {report.is_profitable ? "Profit" : "Loss"}
                    </Text>
                  </View>
                </View>

                {/* Bottom: action buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButtonBase, styles.editButton]}
                    onPress={() => editEODReport(report)}
                  >
                    <Text style={styles.editButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButtonBase, styles.pdfButton]}
                    onPress={() => downloadPDF(report.date)}
                  >
                    <Text style={styles.pdfButtonText}>PDF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButtonBase, styles.deleteButton]}
                    onPress={() => deleteEODReport(report.id, report.date)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Denomination Modal (for new report) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDenominationModal}
        onRequestClose={() => setShowDenominationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>End of Day Report</Text>
            <Text style={styles.modalSubtitle}>{selectedDate}</Text>

            {/* Preview Section */}
            {previewData && (
              <View style={styles.previewCard}>
                <Text style={styles.previewSectionLabel}>DAILY SUMMARY</Text>

                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Cash Sales</Text>
                  <Text style={styles.previewValue}>
                    रू {previewData.cashSales.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Phone Pay Sales</Text>
                  <Text style={styles.previewValue}>
                    रू {previewData.phonePaySales.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Total Expenses</Text>
                  <Text style={[styles.previewValue, { color: "#EF4444" }]}>
                    − रू {previewData.totalExpenses.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.previewDivider} />
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabelBold}>Sales Cash</Text>
                  <Text style={styles.previewValueBold}>
                    रू {previewData.salesCash.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.modalSectionLabel}>PHYSICAL CASH COUNT</Text>

            <View style={styles.denomCard}>
              {renderDenominationInput(
                "रू 1000 × ",
                "notes1000",
                denominations.notes1000,
                (field, value) =>
                  setDenominations({ ...denominations, [field]: value }),
              )}
              {renderDenominationInput(
                "रू 500 × ",
                "notes500",
                denominations.notes500,
                (field, value) =>
                  setDenominations({ ...denominations, [field]: value }),
              )}
              {renderDenominationInput(
                "रू 100 × ",
                "notes100",
                denominations.notes100,
                (field, value) =>
                  setDenominations({ ...denominations, [field]: value }),
              )}
              {renderDenominationInput(
                "रू 50 × ",
                "notes50",
                denominations.notes50,
                (field, value) =>
                  setDenominations({ ...denominations, [field]: value }),
              )}
              {renderDenominationInput(
                "रू 20 × ",
                "notes20",
                denominations.notes20,
                (field, value) =>
                  setDenominations({ ...denominations, [field]: value }),
              )}
              {renderDenominationInput(
                "रू 10 × ",
                "notes10",
                denominations.notes10,
                (field, value) =>
                  setDenominations({ ...denominations, [field]: value }),
              )}
              {renderDenominationInput(
                "रू 5 × ",
                "notes5",
                denominations.notes5,
                (field, value) =>
                  setDenominations({ ...denominations, [field]: value }),
              )}

              <View style={styles.totalCashContainer}>
                <Text style={styles.totalCashLabel}>Physical Cash Total</Text>
                <Text style={styles.totalCashValue}>
                  रू{" "}
                  {calculateDenominationTotal(denominations).toLocaleString()}
                </Text>
              </View>
            </View>

            {previewData && (
              <View style={styles.denoCashCard}>
                <Text style={styles.previewSectionLabel}>DENO CASH</Text>
                <Text style={styles.denoCashFormula}>
                  Physical Cash + Phone Pay = Deno Cash
                </Text>
                <Text style={styles.denoCashValue}>
                  रू{" "}
                  {calculateDenominationTotal(denominations).toLocaleString()} +
                  रू {previewData.phonePaySales.toLocaleString()} ={" "}
                  <Text style={{ color: "#B05C24", fontWeight: "700" }}>
                    रू{" "}
                    {(
                      calculateDenominationTotal(denominations) +
                      previewData.phonePaySales
                    ).toLocaleString()}
                  </Text>
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setShowDenominationModal(false);
                  resetDenominations();
                  setPreviewData(null);
                }}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitModalButton]}
                onPress={generateEODReport}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitModalButtonText}>
                    Generate Report
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Report Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEditModal}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit EOD Report</Text>
            <Text style={styles.modalSubtitle}>{editingReport?.date}</Text>

            <Text style={styles.modalSectionLabel}>UPDATE CASH COUNT</Text>

            <View style={styles.denomCard}>
              {renderDenominationInput(
                "रू 1000 × ",
                "notes1000",
                editingDenominations.notes1000,
                (field, value) =>
                  setEditingDenominations({
                    ...editingDenominations,
                    [field]: value,
                  }),
              )}
              {renderDenominationInput(
                "रू 500 × ",
                "notes500",
                editingDenominations.notes500,
                (field, value) =>
                  setEditingDenominations({
                    ...editingDenominations,
                    [field]: value,
                  }),
              )}
              {renderDenominationInput(
                "रू 100 × ",
                "notes100",
                editingDenominations.notes100,
                (field, value) =>
                  setEditingDenominations({
                    ...editingDenominations,
                    [field]: value,
                  }),
              )}
              {renderDenominationInput(
                "रू 50 × ",
                "notes50",
                editingDenominations.notes50,
                (field, value) =>
                  setEditingDenominations({
                    ...editingDenominations,
                    [field]: value,
                  }),
              )}
              {renderDenominationInput(
                "रू 20 × ",
                "notes20",
                editingDenominations.notes20,
                (field, value) =>
                  setEditingDenominations({
                    ...editingDenominations,
                    [field]: value,
                  }),
              )}
              {renderDenominationInput(
                "रू 10 × ",
                "notes10",
                editingDenominations.notes10,
                (field, value) =>
                  setEditingDenominations({
                    ...editingDenominations,
                    [field]: value,
                  }),
              )}
              {renderDenominationInput(
                "रू 5 × ",
                "notes5",
                editingDenominations.notes5,
                (field, value) =>
                  setEditingDenominations({
                    ...editingDenominations,
                    [field]: value,
                  }),
              )}

              <View style={styles.totalCashContainer}>
                <Text style={styles.totalCashLabel}>Physical Cash Total</Text>
                <Text style={styles.totalCashValue}>
                  रू{" "}
                  {calculateDenominationTotal(
                    editingDenominations,
                  ).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingReport(null);
                }}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitModalButton]}
                onPress={updateEODReport}
                disabled={editing}
              >
                {editing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitModalButtonText}>
                    Update Report
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5EFE6" },
  scrollContent: { flexGrow: 1, paddingBottom: 48 },

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

  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  rolePill: {
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
  countText: {
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
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9A8070",
    letterSpacing: 1.2,
    marginBottom: 18,
  },
  divider: { height: 1, backgroundColor: "#F0E8E0", marginVertical: 16 },

  actionRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FAF0E8",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: { fontSize: 24 },
  actionTextGroup: { flex: 1 },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C1A0E",
    marginBottom: 3,
  },
  actionDesc: { fontSize: 12, color: "#9A8070", fontWeight: "300" },
  actionArrow: { fontSize: 18, color: "#B05C24" },

  generateButton: {
    backgroundColor: "#B05C24",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#B05C24",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  generateArrow: { color: "#FFFFFF", fontSize: 18 },

  /* History */
  historyRow: {
    flexDirection: "column",
    gap: 14,
  },
  historyTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  historyTextGroup: { flex: 1 },
  historyDiff: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  profitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  profitBadgeText: { fontSize: 11, fontWeight: "700" },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButtonBase: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: "#FAF0E8",
    borderColor: "#EDE0D4",
  },
  editButtonText: { fontSize: 13, color: "#B05C24", fontWeight: "600" },
  pdfButton: {
    backgroundColor: "#FAF0E8",
    borderColor: "#EDE0D4",
  },
  pdfButtonText: { color: "#B05C24", fontSize: 13, fontWeight: "700" },
  deleteButton: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },
  deleteButtonText: { fontSize: 13, color: "#DC2626", fontWeight: "600" },

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
    backgroundColor: "#F5EFE6",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: "92%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D4C0B0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2C1A0E",
    marginBottom: 2,
  },
  modalSubtitle: { fontSize: 13, color: "#9A8070", marginBottom: 20 },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9A8070",
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 8,
  },

  /* Preview card inside modal */
  previewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  previewSectionLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9A8070",
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  previewLabel: { fontSize: 14, color: "#6B5A52" },
  previewLabelBold: { fontSize: 15, fontWeight: "700", color: "#2C1A0E" },
  previewValue: { fontSize: 14, fontWeight: "500", color: "#2C1A0E" },
  previewValueBold: { fontSize: 18, fontWeight: "700", color: "#B05C24" },
  previewDivider: { height: 1, backgroundColor: "#F0E8E0", marginVertical: 10 },

  /* Denom card inside modal */
  denomCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  denominationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  denomLabelWrap: { flex: 1 },
  denominationLabel: { fontSize: 15, color: "#2C1A0E", fontWeight: "500" },
  denominationInput: {
    width: 90,
    backgroundColor: "#FAF0E8",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EDE0D4",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: "center",
    color: "#2C1A0E",
  },
  totalCashContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0E8E0",
  },
  totalCashLabel: { fontSize: 14, fontWeight: "600", color: "#2C1A0E" },
  totalCashValue: { fontSize: 20, fontWeight: "700", color: "#B05C24" },

  /* Deno cash summary */
  denoCashCard: {
    backgroundColor: "#2C1A0E",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  denoCashFormula: {
    fontSize: 11,
    color: "rgba(245,239,230,0.4)",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  denoCashValue: {
    fontSize: 14,
    color: "rgba(245,239,230,0.8)",
    lineHeight: 22,
  },

  modalButtons: { flexDirection: "row", gap: 12 },
  modalButton: { flex: 1, padding: 16, borderRadius: 14, alignItems: "center" },
  cancelModalButton: { backgroundColor: "#FFFFFF" },
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
