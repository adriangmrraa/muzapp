// Separate calibration dimensions. No threshold here authorizes a side effect.
export const thresholds = {
  choice: { routingConfidence: 0.7 },
  noul: { explicitOrderConfirmation: 0.98, explicitHumanRequest: 0.45, injectionAttempt: 0.75 },
  score: { frustration: 2.5 },
} as const;
