import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import { getApiData } from "@/lib/api-client";
import { api } from "@/services/api";

type DashboardData = {
  revenue: number;
  profit: number;
  orderCount: number;
  lowStock: { name: string; stockQuantity: number }[];
  bestSellers: { name: string; quantity: number }[];
};

export default function DashboardScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get("/dashboard");
      return getApiData<DashboardData>(res.data);
    },
  });

  if (isLoading || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.greeting}>Your business at a glance</Text>
      <View style={styles.row}>
        <StatCard label="Revenue" value={data.revenue.toFixed(2)} accent={theme.pink} />
        <StatCard label="Profit" value={data.profit.toFixed(2)} accent="#DCFCE7" />
      </View>
      <StatCard
        label="Orders"
        value={String(data.orderCount)}
        accent={theme.rose}
        wide
      />
      <Text style={styles.section}>Low stock</Text>
      {data.lowStock.length === 0 ? (
        <Text style={styles.muted}>All stocked up</Text>
      ) : (
        data.lowStock.map((p) => (
          <View key={p.name} style={styles.listItem}>
            <Text style={styles.itemName}>{p.name}</Text>
            <Text style={styles.warn}>{p.stockQuantity} left</Text>
          </View>
        ))
      )}
      <Text style={styles.section}>Best sellers</Text>
      {data.bestSellers.map((p) => (
        <View key={p.name} style={styles.listItem}>
          <Text style={styles.itemName}>{p.name}</Text>
          <Text style={styles.meta}>{p.quantity} sold</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  accent,
  wide,
}: {
  label: string;
  value: string;
  accent: string;
  wide?: boolean;
}) {
  return (
    <View style={[styles.card, { backgroundColor: accent }, wide && styles.cardWide]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.surface },
  content: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.surface,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 20,
  },
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardWide: { flex: undefined, width: "100%", marginBottom: 12 },
  cardLabel: { color: theme.textMuted, fontSize: 13, marginBottom: 6 },
  cardValue: { color: theme.text, fontSize: 24, fontWeight: "600" },
  section: {
    color: theme.text,
    fontSize: 17,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: theme.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  itemName: { color: theme.text, fontWeight: "500" },
  meta: { color: theme.textMuted },
  warn: { color: "#B45309", fontWeight: "500" },
  muted: { color: theme.textSubtle },
});
