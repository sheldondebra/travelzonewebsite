import { useQuery } from "@tanstack/react-query";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import { getApiData } from "@/lib/api-client";
import { api } from "@/services/api";

type Order = {
  id: string;
  totalAmount: number;
  profit: number;
  paymentStatus: string;
  deliveryStatus: string;
  customer: { name: string };
};

export default function OrdersScreen() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get("/orders");
      return getApiData<Order[]>(res.data);
    },
  });

  return (
    <View style={styles.container}>
      {isLoading ? (
        <Text style={styles.muted}>Loading...</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.name}>{item.customer.name}</Text>
              <Text style={styles.meta}>
                {item.totalAmount.toFixed(2)} · Profit {item.profit.toFixed(2)}
              </Text>
              <View style={styles.badges}>
                <Text style={styles.badge}>{item.paymentStatus}</Text>
                <Text style={styles.badge}>{item.deliveryStatus}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.muted}>No orders yet</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.surface },
  list: { padding: 16, paddingBottom: 32 },
  row: {
    backgroundColor: theme.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  name: { color: theme.text, fontSize: 16, fontWeight: "600" },
  meta: { color: theme.textMuted, marginTop: 6, fontSize: 14 },
  badges: { flexDirection: "row", gap: 8, marginTop: 10 },
  badge: {
    backgroundColor: theme.rose,
    color: theme.text,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  muted: { color: theme.textSubtle, padding: 16 },
});
