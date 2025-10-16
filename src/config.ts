const TOKEN_ACCOUNT_RENT_EXEMPTION = 0.002;
const HOSICO_MINT = '9wK8yN6iz1ie5kEJkvZCTxyN1x5sTdNfx8yeMY8Ebonk';

export const config = {
    rpcUrl: "https://mainnet.helius-rpc.com/?api-key=22a5a327-77fd-4021-b6d3-2d1ccb26fb18",
    tokenAccountRentExemption: TOKEN_ACCOUNT_RENT_EXEMPTION,
    hosico: {
        mint: HOSICO_MINT,
        decimals: 6
    },
    clusterId: "mainnet"
}