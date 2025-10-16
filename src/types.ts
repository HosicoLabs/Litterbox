export interface TokenData {
  mint: string;
  accountPubkey: string;
  uiAmount: number;
  owner: string;
  programId: string; // Track which token program this account belongs to
  image?: string;
  symbol?: string;
  name?: string;
  priceUSD?: number;
}
