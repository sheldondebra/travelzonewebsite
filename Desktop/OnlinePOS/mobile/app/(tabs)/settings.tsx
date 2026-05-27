import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import { useAuthStore } from "@/store/auth";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  function signOut() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      {user ? (
        <View style={styles.card}>
          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.value}>{user.email}</Text>
          {!user.businessId ? (
            <Text style={styles.hint}>
              Complete business setup on the web dashboard first.
            </Text>
          ) : null}
        </View>
      ) : null}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && { opacity: 0.9 },
        ]}
        onPress={signOut}
      >
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.surface, padding: 20 },
  card: {
    backgroundColor: theme.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
  },
  label: { color: theme.textMuted, fontSize: 13 },
  value: { color: theme.text, fontSize: 17, fontWeight: "500", marginTop: 4 },
  hint: { color: "#B45309", marginTop: 12, fontSize: 14, lineHeight: 20 },
  button: {
    backgroundColor: theme.rose,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  buttonText: { color: theme.text, fontWeight: "600", fontSize: 16 },
});
