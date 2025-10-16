export interface TokenData {
  mint: string;
  accountPubkey: string;
  uiAmount: number;
  owner: string;
  programId: string;
  image?: string;
  symbol?: string;
  name?: string;
  priceUSD?: number;
  state?: string;
  closeAuthority?: string;
  delegate?: string;
  delegatedAmount?: string | number;
  extensions?: any[];
}
