// Contract addresses and module names for deployed Move contracts
export const CONTRACTS = {
  PAYMENT: {
    address: "0xb0fcc55b9a116fec51295eb73b03ac31083a841290405c955fc088c2eeb0bf27",
    module: "payment_contract",
  },
  VOICE_IDENTITY: {
    address: "0x594d426ee5f8d800c7ede249d83a4cbfc4ee0c7dbcefece5ae6e727b7b0cf9db",
    module: "voice_identity",
  },
  PLATFORM_ADDRESS: "0xb0fcc55b9a116fec51295eb73b03ac31083a841290405c955fc088c2eeb0bf27", // Platform fee recipient
} as const;

// Fee structure (matching Move contract)
export const FEE_STRUCTURE = {
  PLATFORM_FEE_BPS: 250, // 2.5%
  ROYALTY_BPS: 1000, // 10%
} as const;

// Helper to calculate payment breakdown
export function calculatePaymentBreakdown(totalAmount: number) {
  const platformFee = Math.floor((totalAmount * FEE_STRUCTURE.PLATFORM_FEE_BPS) / 10_000);
  const remainingAfterPlatform = totalAmount - platformFee;
  const royaltyAmount = Math.floor((remainingAfterPlatform * FEE_STRUCTURE.ROYALTY_BPS) / 10_000);
  const creatorAmount = remainingAfterPlatform - royaltyAmount;

  return {
    totalAmount,
    platformFee,
    royaltyAmount,
    creatorAmount,
  };
}

// Convert APT to Octas (1 APT = 100,000,000 Octas)
export function aptToOctas(apt: number): number {
  return Math.floor(apt * 100_000_000);
}

// Convert Octas to APT
export function octasToApt(octas: number): number {
  return octas / 100_000_000;
}
