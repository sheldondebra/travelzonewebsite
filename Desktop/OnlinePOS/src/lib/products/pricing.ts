export type PricingInput = {
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  minimumPrice: number;
};

export type PricingValidation = {
  errors: string[];
  warnings: string[];
};

export function validatePricing(input: PricingInput): PricingValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (input.costPrice < 0) errors.push("Buying price cannot be negative.");
  if (input.retailPrice < 0) errors.push("Selling price cannot be negative.");
  if (input.wholesalePrice < 0) errors.push("Wholesale price cannot be negative.");
  if (input.minimumPrice < 0) errors.push("Lowest allowed price cannot be negative.");

  if (input.retailPrice < input.minimumPrice) {
    errors.push("Selling price cannot be below the lowest allowed price.");
  }

  if (input.wholesalePrice < input.costPrice) {
    warnings.push("Wholesale price is below buying price. This may create a loss.");
  }

  if (input.minimumPrice < input.costPrice) {
    warnings.push(
      "Lowest allowed price is below buying price. Staff may sell at a loss.",
    );
  }

  return { errors, warnings };
}

export function assertPricingValid(input: PricingInput) {
  const { errors } = validatePricing(input);
  if (errors.length > 0) {
    throw new Error(errors[0]);
  }
}

export function applyPercentChange(price: number, percent: number): number {
  return Math.round(price * (1 + percent / 100) * 100) / 100;
}

export function applyFixedChange(price: number, amount: number): number {
  return Math.round((price + amount) * 100) / 100;
}
