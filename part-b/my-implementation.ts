// B2. My own implementation of part-b/01-delivery-fee.pseudocode.md, written WITHOUT AI.
// Each numbered pseudocode step is marked with a comment (// step 1, // step 2 ...) so every
// piece of code traces back to a step.
//
// NOT WRITTEN YET. Until it is, `npm run compare` reports this column as "not implemented".

export type Result =
  | { feeMinor: number; currency: "NGN"; band: "standard" | "peak" | "night"; freeDelivery: boolean }
  | { error: string };

export function calculateDeliveryFee(distanceMetres: number, subtotalMinor: number, itemCount: number, orderedAt: Date): Result {
  throw new Error("NOT IMPLEMENTED");
}
