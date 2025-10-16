import { ReactNode } from 'react'
import { createSolanaMainnet, createWalletUiConfig, WalletUi } from '@wallet-ui/react'
import { WalletUiGillProvider } from '@wallet-ui/react-gill'
import { solanaMobileWalletAdapter } from './solana-mobile-wallet-adapter'

import { config as appConfig } from '@/config'

const config = createWalletUiConfig({
  clusters: [createSolanaMainnet({
    url: appConfig.rpcUrl
  })],
})

solanaMobileWalletAdapter({ clusters: config.clusters })

export function SolanaProvider({ children }: { children: ReactNode }) {
  return (
    <WalletUi config={config}>
      <WalletUiGillProvider>{children}</WalletUiGillProvider>
    </WalletUi>
  )
}
