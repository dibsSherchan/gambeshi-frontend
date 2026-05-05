import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../src/services/store/authStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (!result.success) {
      Alert.alert(
        "Login Failed",
        result.error || "Invalid credentials. Please try again.",
      );
    }
    // On success, AuthGate will automatically redirect based on role
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Dark top band */}
        <View style={styles.topBand} />

        {/* Logo / Brand Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🍛</Text>
          </View>
          <Text style={styles.title}>Gambeshi</Text>
          <Text style={styles.subtitle}>Thakali Bhanchaghar</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Welcome back</Text>
          <Text style={styles.welcomeSubtitle}>
            Sign in to your staff account
          </Text>

          {/* Email Input */}
          <View style={styles.field}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#C4B0A4"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            <Text style={styles.helperText}>
              ℹ️ Use the email address given to you by your manager
            </Text>
          </View>

          {/* Password Input */}
          <View style={styles.field}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔑</Text>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your password"
                placeholderTextColor="#C4B0A4"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeBtnText}>
                  {showPassword ? "🙈" : "👁️"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              ℹ️ Enter the password provided to you at setup
            </Text>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#F5EFE6" />
            ) : (
              <>
                <Text style={styles.signInBtnText}>Sign In</Text>
                <Text style={styles.signInArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Secure Note */}
          <Text style={styles.secureNote}>🔒 Secure staff access only</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5EFE6",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // Dark top band behind the header
  topBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: "#2C1A0E",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  // Header (sits on top of dark band)
  header: {
    alignItems: "center",
    paddingTop: 64,
    paddingBottom: 32,
  },
  logoContainer: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "#B05C24",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.08)",
  },
  logoEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#F5EFE6",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: "rgba(245,239,230,0.5)",
    marginTop: 5,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    fontWeight: "300",
  },

  // White card
  card: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2C1A0E",
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: "#9A8070",
    marginBottom: 28,
    fontWeight: "300",
  },

  // Fields
  field: {
    marginBottom: 20,
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
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
    opacity: 0.5,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#2C1A0E",
  },
  passwordInput: {
    paddingRight: 8,
  },
  eyeBtn: {
    padding: 4,
  },
  eyeBtnText: {
    fontSize: 18,
    opacity: 0.45,
  },
  helperText: {
    fontSize: 12,
    color: "#B09080",
    marginTop: 6,
    lineHeight: 16,
  },

  // Sign In button
  signInBtn: {
    backgroundColor: "#2C1A0E",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  signInBtnDisabled: {
    opacity: 0.55,
  },
  signInBtnText: {
    color: "#F5EFE6",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  signInArrow: {
    color: "#F5EFE6",
    fontSize: 18,
  },

  // Secure note
  secureNote: {
    textAlign: "center",
    fontSize: 11,
    color: "#C4B0A4",
    marginTop: 18,
  },
});
