/** Returns the max decimal places allowed for monetary values from env (default 2). */
export function getMaxPriceDecimals(): number {
  const raw = process.env.MAX_PRICE_DECIMALS
  if (raw === undefined || raw === '') {
    return 2
  }
  const parsed = parseInt(raw, 10)
  if (Number.isNaN(parsed) || parsed < 0) {
    return 2
  }
  return parsed
}

/** Rounds a monetary value to the configured max decimal places (half up). */
export function roundToMaxDecimals(value: number): number {
  const decimals = getMaxPriceDecimals()
  const factor = Math.pow(10, decimals)
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/** Coerces and rounds a value for Plemsi monetary fields. */
export function toPlemsiAmount(value: unknown): number {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) {
    return 0
  }
  return roundToMaxDecimals(numeric)
}
