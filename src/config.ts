const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=22a5a327-77fd-4021-b6d3-2d1ccb26fb18"

const TOKEN_ACCOUNT_RENT_EXEMPTION = 0.0024;

const SOL_MINT = "So11111111111111111111111111111111111111112"
const HOSICO_MINT = "9wK8yN6iz1ie5kEJkvZCTxyN1x5sTdNfx8yeMY8Ebonk"

const SOL_DECIMALS = 9;
const HOSICO_DECIMALS = 6;

const CLUSTER_ID = "mainnet"

const ITEMS_PER_PAGE = 8

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
    itemsPerPage: ITEMS_PER_PAGE
}