import { useQuery } from "@tanstack/react-query";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import { getApiData } from "@/lib/api-client";
import { api } from "@/services/api";

type Product = {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
};

export default function ProductsScreen() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await api.get("/products");
      return getApiData<Product[]>(res.data);
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
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.price.toFixed(2)} · Stock {item.stockQuantity}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.muted}>
              No products yet. Add them on the web dashboard.
            </Text>
          }
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
  muted: { color: theme.textSubtle, padding: 16 },
});
