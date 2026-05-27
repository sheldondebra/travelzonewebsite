/** Parse simple CSV text into rows (handles quoted fields). */
export function parseCsv(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => {
    const row: string[] = [];
    let cell = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === "," && !inQuotes) {
        row.push(cell.trim());
        cell = "";
        continue;
      }
      cell += ch;
    }
    row.push(cell.trim());
    return row;
  });
}

export const IMPORT_TEMPLATE = `name,sku,barcode,price,costPrice,stock,category,subCategory,brand,unit
Sample T-Shirt,TS-001,1234567890,120,80,25,Fashion,Unisex,Local Brand,pcs`;
