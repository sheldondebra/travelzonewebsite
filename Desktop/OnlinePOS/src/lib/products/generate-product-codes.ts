function randomDigits(length: number): string {
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += Math.floor(Math.random() * 10);
  }
  return value;
}

function compactNamePrefix(name: string): string {
  const compact = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 4);

  return compact ? compact.padEnd(4, "X") : "PROD";
}

export function generateProductSku(name = ""): string {
  return `${compactNamePrefix(name)}-${randomDigits(6)}`;
}

export function generateProductBarcode(): string {
  return `60${randomDigits(10)}`;
}
