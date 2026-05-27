export class ImportIdMaps {
  categories = new Map<string, string>();
  subcategories = new Map<string, string>();
  brands = new Map<string, string>();
  units = new Map<string, string>();
  warehouses = new Map<string, string>();
  products = new Map<string, string>();
  variants = new Map<string, string>();
  clients = new Map<string, string>();
  sales = new Map<string, string>();
  users = new Map<string, string>();
  cash_registers = new Map<string, string>();
  sale_returns = new Map<string, string>();

  set(table: keyof ImportIdMaps, oldId: bigint | string | null, newId: string) {
    if (oldId == null) return;
    const key = String(oldId);
    const map = this[table] as Map<string, string>;
    map.set(key, newId);
  }

  get(table: keyof ImportIdMaps, oldId: bigint | string | null): string | undefined {
    if (oldId == null) return undefined;
    return (this[table] as Map<string, string>).get(String(oldId));
  }
}
