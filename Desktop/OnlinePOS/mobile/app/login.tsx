import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { theme } from "@/constants/theme";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      const { data: res } = await api.post("/auth", { email, password });
      const data = res.data;
      if (!data?.token || !data?.user) throw new Error("Invalid response");
      setAuth(data.token, data.user);
      if (!data.user.businessId) {
        router.replace("/settings");
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Tecunit · Social Commerce</Text>
      </View>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to manage your shop</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={theme.textSubtle}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={theme.textSubtle}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && { backgroundColor: theme.pinkHover },
        ]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.text} />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    backgroundColor: theme.cream,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: theme.rose,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 24,
  },
  badgeText: { fontSize: 12, color: theme.text, fontWeight: "500" },
  title: { fontSize: 32, fontWeight: "600", color: theme.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: theme.textMuted, marginBottom: 28 },
  input: {
    backgroundColor: theme.white,
    borderRadius: 14,
    padding: 16,
    color: theme.text,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.border,
    fontSize: 16,
  },
  button: {
    backgroundColor: theme.pink,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    minHeight: 52,
    justifyContent: "center",
  },
  buttonText: { color: theme.text, fontWeight: "600", fontSize: 16 },
  error: { color: "#EF4444", marginBottom: 8 },
});
