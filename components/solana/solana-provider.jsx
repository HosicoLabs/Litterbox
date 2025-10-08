import { createSolanaDevnet, createSolanaLocalnet, createWalletUiConfig, WalletUi } from '@wallet-ui/react'
import { solanaMobileWalletAdapter } from './solana-mobile-wallet-adapter'

const config = createWalletUiConfig({
    clusters: [createSolanaDevnet(), createSolanaLocalnet()],
})

solanaMobileWalletAdapter({ clusters: config.clusters })

export function SolanaProvider({ children }) {
    return <WalletUi config={config}>{children}</WalletUi>
}