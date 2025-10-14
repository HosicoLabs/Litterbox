'use client'

import { SolanaProvider } from '../solana/solana-provider' 
import React from 'react'

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <SolanaProvider>
            {children}
        </SolanaProvider>
    )
}