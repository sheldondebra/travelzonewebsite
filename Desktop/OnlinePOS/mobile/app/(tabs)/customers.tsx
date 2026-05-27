import { useQuery } from "@tanstack/react-query";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import { getApiData } from "@/lib/api-client";
import { api } from "@/services/api";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
};

export default function CustomersScreen() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await api.get("/customers");
      return getApiData<Customer[]>(res.data);
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
              {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.muted}>No customers yet</Text>}
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
