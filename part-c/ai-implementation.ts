export type Band = "standard" | "peak" | "night";

export type DeliveryFeeErrorCode =
  | "INVALID_DISTANCE"
  | "INVALID_SUBTOTAL"
  | "INVALID_ITEM_COUNT"
  | "INVALID_TIME"
  | "OUT_OF_RANGE";

export interface DeliveryFee {
  feeMinor: number;
  currency: "NGN";
  band: Band;
  freeDelivery: boolean;
}

export interface DeliveryFeeError {
  error: DeliveryFeeErrorCode;
}

export function calculateDeliveryFee(
  distanceMetres: number,
  subtotalMinor: number,
  itemCount: number,
  orderedAt: Date,
): DeliveryFee | DeliveryFeeError {
  if (!Number.isInteger(distanceMetres) || distanceMetres < 0) {
    return { error: "INVALID_DISTANCE" };
  }
  if (!Number.isInteger(subtotalMinor) || subtotalMinor < 0) {
    return { error: "INVALID_SUBTOTAL" };
  }
  if (!Number.isInteger(itemCount) || itemCount < 1) {
    return { error: "INVALID_ITEM_COUNT" };
  }
  if (!(orderedAt instanceof Date) || Number.isNaN(orderedAt.getTime())) {
    return { error: "INVALID_TIME" };
  }
  if (distanceMetres > 15000) {
    return { error: "OUT_OF_RANGE" };
  }

  const band = timeBand(orderedAt);

  if (subtotalMinor >= 1500000 && distanceMetres <= 5000) {
    return { feeMinor: 0, currency: "NGN", band, freeDelivery: true };
  }

  let fee = 50000;

  if (distanceMetres > 2000) {
    const extra = distanceMetres - 2000;
    const blocks = Math.ceil(extra / 1000);
    fee += blocks * 10000;
  }

  if (band === "peak") {
    fee = Math.floor((fee * 125) / 100);
  } else if (band === "night") {
    fee = Math.floor((fee * 150) / 100);
  }

  if (itemCount > 10) {
    fee += 20000;
  }

  if (fee % 5000 !== 0) {
    fee = (Math.floor(fee / 5000) + 1) * 5000;
  }

  return { feeMinor: fee, currency: "NGN", band, freeDelivery: false };
}

export function timeBand(orderedAt: Date): Band {
  let lagosHour = orderedAt.getUTCHours() + 1;
  if (lagosHour === 24) {
    lagosHour = 0;
  }
  if (lagosHour === 12 || lagosHour === 13) {
    return "peak";
  }
  if (lagosHour === 18 || lagosHour === 19 || lagosHour === 20) {
    return "peak";
  }
  if (lagosHour === 22 || lagosHour === 23 || (lagosHour >= 0 && lagosHour <= 5)) {
    return "night";
  }
  return "standard";
}
