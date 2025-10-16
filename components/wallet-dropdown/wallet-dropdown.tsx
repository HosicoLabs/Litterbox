'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../../src/components/ui/dropdown-menu'
import * as React from 'react'
import { ellipsify, UiWallet, useWalletUi, useWalletUiWallet } from '@wallet-ui/react'
import { Button } from '../../src/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../../src/components/ui/avatar'
import { cn } from '@/lib/utils'

function WalletAvatar({ className, wallet }: { className?: string; wallet: UiWallet }) {
    return (
        <Avatar className={cn('rounded-md h-6 w-6', className)}>
            <AvatarImage src={wallet.icon} alt={wallet.name} />
            <AvatarFallback>{wallet.name[0]}</AvatarFallback>
        </Avatar>
    )
}

function WalletDropdownItem({ wallet }: { wallet: UiWallet }) {
    const { connect } = useWalletUiWallet({ wallet })

    return (
        <DropdownMenuItem
            className="cursor-pointer w-full"
            key={wallet.name}
            onClick={() => {
                return connect()
            }}
        >
            {wallet.icon ? <WalletAvatar wallet={wallet} /> : null}
            {wallet.name}
        </DropdownMenuItem>
    )
}

function WalletDropdown() {
    const { account, connected, copy, disconnect, wallet, wallets } = useWalletUi()
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className='flex w-full gap-3 justify-between items-center'>
                    <span className="circle"></span>
                    <Button variant="outline" className="cursor-pointer bg-[#ff6900] text-white h-max">
                        {wallet?.icon ? <WalletAvatar wallet={wallet} /> : null}
                        {connected ? (account ? ellipsify(account.address) : wallet?.name) : 'Connect Wallet'}
                    </Button>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='bg-[#02000f] border border-gray-700 text-white gap-2 flex flex-col justify-center items-start px-3! py-2!' align="end">
                {account ? (
                    <>
                        <DropdownMenuItem className="cursor-pointer w-full" onClick={copy}>
                            Copy address
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer w-full" onClick={disconnect}>
                            Disconnect
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                ) : null}
                {wallets.length ? (
                    wallets.map((wallet) => <WalletDropdownItem key={wallet.name} wallet={wallet} />)
                ) : (
                    <DropdownMenuItem className="cursor-pointer" asChild>
                        <a href="https://solana.com/solana-wallets" target="_blank" rel="noopener noreferrer">
                            Get a Solana wallet to connect.
                        </a>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export { WalletDropdown }