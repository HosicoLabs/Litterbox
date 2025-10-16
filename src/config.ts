const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=22a5a327-77fd-4021-b6d3-2d1ccb26fb18"

const TOKEN_ACCOUNT_RENT_EXEMPTION = 0.0024;

const SOL_MINT = "So11111111111111111111111111111111111111112"
const HOSICO_MINT = "9wK8yN6iz1ie5kEJkvZCTxyN1x5sTdNfx8yeMY8Ebonk"

const SOL_DECIMALS = 1_000_000_000;
const HOSICO_DECIMALS = 1_000_000;

const CLUSTER_ID = "mainnet"

const ITEMS_PER_PAGE = 8

const TX_TIP = 0.007 // 0.7% transaction tip
const TIP_WALLET = "D5TiA9gpwdXgAc1KcMr6uWLUKBwfAR5xbhAMofda4NcB"

export const config = {
    rpcUrl: RPC_URL,
    tokenAccountRentExemption: TOKEN_ACCOUNT_RENT_EXEMPTION,
    tokens: {
        sol: {
            mint: SOL_MINT,
            decimals: SOL_DECIMALS
        },
        hosico: {
            mint: HOSICO_MINT,
            decimals: HOSICO_DECIMALS
        },
    },
    clusterId: CLUSTER_ID,
    itemsPerPage: ITEMS_PER_PAGE,
    txTip: TX_TIP,
    tipWallet: TIP_WALLET
}