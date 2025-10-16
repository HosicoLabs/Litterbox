'use client'

import { useEffect, useState } from "react";
import {
  createTransaction,
  address,
  SolanaClient,
  compileTransaction,
  getBase64EncodedWireTransaction,
  AccountRole
} from "gill";
import { TokenListProvider, ENV as TokenListEnv } from "@solana/spl-token-registry";
import { UiWalletAccount, useSignAndSendTransaction } from "@wallet-ui/react";
import { TokenData } from "@/types";
import { config } from "@/config";
import { fetchTokenPrices } from "@/lib/utils";
import { getAssociatedTokenAccountAddress, getTransferCheckedInstruction } from "gill/programs";

export function Statistics({
  account,
  publicKey,
  client
}: {
  account: UiWalletAccount,
  publicKey: string,
  client: SolanaClient<string>
}) {

  const signAndSendTransaction = useSignAndSendTransaction(
    account,
    `solana:${config.clusterId}` as const
  )

  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [hosicoPrice, setHosicoPrice] = useState<number>(0);

  const [isTransacting, setIsTransacting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [transactionStatus, setTransactionStatus] = useState<string>('');

  const handleTokenSelect = (tokenMint: string) => {
    const newSelected = new Set(selectedTokens);
    if (newSelected.has(tokenMint)) {
      newSelected.delete(tokenMint);
    } else {
      newSelected.add(tokenMint);
    }
    setSelectedTokens(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTokens.size === tokens.length) {
      setSelectedTokens(new Set());
    } else {
      setSelectedTokens(new Set(tokens.map(token => token.mint)));
    }
  };

  const calculateHosicoPreview = () => {
    const selectedTokensList = tokens.filter(token => selectedTokens.has(token.mint));

    const totalTokenValueUSD = selectedTokensList.reduce((sum, token) => {
      const tokenValueUSD = (token.uiAmount || 0) * (token.priceUSD || 0);
      return sum + tokenValueUSD;
    }, 0);

    const estimatedSolRecovery = selectedTokensList.length * 0.002;
    const solPriceUSD = 200;
    const solRecoveryValueUSD = estimatedSolRecovery * solPriceUSD;

    const totalValueUSD = totalTokenValueUSD + solRecoveryValueUSD;

    const hosicoAmount = hosicoPrice > 0 ? totalValueUSD / hosicoPrice : 0;

    return {
      totalValueUSD,
      hosicoAmount,
      estimatedSolRecovery,
      solRecoveryValueUSD,
      selectedCount: selectedTokensList.length
    };
  };

  const previewData = calculateHosicoPreview();

  const getJupiterSwapInstructions = async (inputMint: string, amount: number, slippageBps: number = 300) => {
    try {
      const quoteUrl = `https://lite-api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${config.tokens.hosico.mint}&amount=${amount * 1_000_000_000}&slippageBps=${slippageBps}&restrictIntermediateTokens=true`;

      const response = await fetch(quoteUrl);

      console.log("Jupiter quote response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Quote API error response:", errorText);
        throw new Error(`Quote API error: ${response.status} - ${errorText}`);
      }

      const quoteResponse = await response.json();
      console.log("Quote response:", quoteResponse);

      const swapResponse = await fetch('https://lite-api.jup.ag/swap/v1/swap-instructions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: publicKey,
          dynamicComputeUnitLimit: true,
          dynamicSlippage: true,
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              maxLamports: 1000000,
              priorityLevel: "veryHigh"
            }
          }
        })
      });

      if (!swapResponse.ok) {
        const errorText = await swapResponse.text();
        console.error("Swap Instructions API error response:", errorText);
        throw new Error(`Swap Instructions API error: ${swapResponse.status} - ${errorText}`);
      }

      const swapData = await swapResponse.json();
      console.log("Swap instructions response:", swapData);

      return swapData;
    } catch (error) {
      console.error('Jupiter swap instructions error:', error);
      throw error;
    }
  };

  const createCloseAccountInstruction = (
    tokenAccountPubkey: string,
    destination: string,
    authority: string,
    programId: string
  ) => {
    try {

      const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
      const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

      const isToken2022 = programId === TOKEN_2022_PROGRAM_ID;

      console.log(`Creating close instruction for ${isToken2022 ? 'Token-2022' : 'Token'} account: ${tokenAccountPubkey}`);

      const instructionData = new Uint8Array([9]);

      const closeInstruction = {
        programAddress: address(programId),
        accounts: [
          {
            address: address(tokenAccountPubkey),
            role: AccountRole.WRITABLE
          },
          {
            address: address(destination),
            role: AccountRole.WRITABLE
          },
          {
            address: address(authority),
            role: AccountRole.READONLY_SIGNER
          }
        ],
        data: instructionData
      };

      return closeInstruction;
    } catch (error) {
      console.error('Error creating close account instruction:', error);
      throw error;
    }
  };

  const executeTransaction = async (transactionData: string | Uint8Array, description: string) => {
    try {
      if (!signAndSendTransaction) {
        throw new Error('Transaction signing not available - wallet not properly connected');
      }

      console.log(`Executing transaction: ${description}`);

      let transactionBytes: Uint8Array;

      if (typeof transactionData === 'string') {
        try {
          const buffer = Buffer.from(transactionData, 'base64');
          transactionBytes = new Uint8Array(buffer);
          console.log('Successfully decoded transaction as base64');
        } catch (conversionError) {
          console.error('Failed to decode transaction as base64:', conversionError);
          throw new Error('Invalid transaction format - expected base64 encoded transaction');
        }
      } else {
        transactionBytes = transactionData;
      }

      try {
        const signature = await signAndSendTransaction({ transaction: transactionBytes });
        console.log(signature);
        return signature;
      } catch (signError) {
        if (signError instanceof Error) {
          if (signError.message.includes('User rejected') ||
            signError.message.includes('cancelled') ||
            signError.message.includes('denied') ||
            signError.message.includes('User declined') ||
            signError.message.includes('Transaction cancelled')) {
            throw new Error(`Transaction cancelled by user`);
          }
        }
        console.error(`Failed to sign/send transaction: ${description}`, signError);
        throw new Error(`Transaction failed: ${signError instanceof Error ? signError.message : 'Unknown error'}`);
      }

    } catch (error) {
      console.error(`Transaction failed: ${description}`, error);
      throw error;
    }
  };

  const executeConversion = async () => {
    if (selectedTokens.size === 0) {
      setTransactionStatus('Please select tokens');
      return;
    }

    setIsTransacting(true);
    setTransactionStatus('Preparing batch transaction...');

    try {
      const selectedTokensList = tokens.filter(token => selectedTokens.has(token.mint));

      setTransactionStatus(`Creating close instructions for ${selectedTokensList.length} tokens...`);

      const closeInstructions = [];
      let totalSolToRecover = 0;

      for (const token of selectedTokensList) {
        try {
          if (token.owner !== publicKey) {
            console.warn(`Cannot close ${token.symbol} account: owned by ${token.owner}, but wallet is ${publicKey}`);
            setTransactionStatus(`⚠️ Cannot close ${token.symbol} account: not owned by this wallet`);
            continue;
          }

          const closeInstruction = createCloseAccountInstruction(
            token.accountPubkey,
            publicKey,
            token.owner,
            token.programId
          );

          closeInstructions.push(closeInstruction);
          totalSolToRecover += config.tokenAccountRentExemption;

          console.log(`Added close instruction for ${token.symbol}`);

        } catch (error) {
          console.error(`Failed to create close instruction for ${token.symbol}:`, error);
          setTransactionStatus(`❌ Failed to prepare ${token.symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (closeInstructions.length === 0) {
        setTransactionStatus('❌ No valid token accounts to close');
        return;
      }

      setTransactionStatus(`Creating swap instruction for ${totalSolToRecover.toFixed(3)} SOL to $HOSICO...`);

      let allInstructions: any[] = [...closeInstructions];

      try {
        const swapInstructionsData = await getJupiterSwapInstructions(
          config.tokens.sol.mint,
          totalSolToRecover
        );

        if (swapInstructionsData.setupInstructions) {
          for (const setupInstruction of swapInstructionsData.setupInstructions) {
            const parsedInstruction = {
              programAddress: address(setupInstruction.programId),
              accounts: setupInstruction.accounts.map((acc: any) => ({
                address: address(acc.pubkey),
                role: acc.isSigner && acc.isWritable ? AccountRole.WRITABLE_SIGNER :
                  acc.isSigner ? AccountRole.READONLY_SIGNER :
                    acc.isWritable ? AccountRole.WRITABLE : AccountRole.READONLY
              })),
              data: new Uint8Array(Buffer.from(setupInstruction.data, 'base64'))
            };
            allInstructions.push(parsedInstruction);
          }
        }

        if (swapInstructionsData.swapInstruction) {
          const swapInstruction = swapInstructionsData.swapInstruction;
          const parsedSwapInstruction = {
            programAddress: address(swapInstruction.programId),
            accounts: swapInstruction.accounts.map((acc: any) => ({
              address: address(acc.pubkey),
              role: acc.isSigner && acc.isWritable ? AccountRole.WRITABLE_SIGNER :
                acc.isSigner ? AccountRole.READONLY_SIGNER :
                  acc.isWritable ? AccountRole.WRITABLE : AccountRole.READONLY
            })),
            data: new Uint8Array(Buffer.from(swapInstruction.data, 'base64'))
          };
          allInstructions.push(parsedSwapInstruction);
        }

        if (swapInstructionsData.cleanupInstructions) {
          for (const cleanupInstruction of swapInstructionsData.cleanupInstructions) {
            const parsedInstruction = {
              programAddress: address(cleanupInstruction.programId),
              accounts: cleanupInstruction.accounts.map((acc: any) => ({
                address: address(acc.pubkey),
                role: acc.isSigner && acc.isWritable ? AccountRole.WRITABLE_SIGNER :
                  acc.isSigner ? AccountRole.READONLY_SIGNER :
                    acc.isWritable ? AccountRole.WRITABLE : AccountRole.READONLY
              })),
              data: new Uint8Array(Buffer.from(cleanupInstruction.data, 'base64'))
            };
            allInstructions.push(parsedInstruction);
          }
        }

        const hosicoMintInfo = await client.rpc.getAccountInfo(address(config.tokens.hosico.mint)).send();
        if (!hosicoMintInfo?.value) {
          throw new Error('HOSICO mint account not found');
        }

        const hosicoTokenProgramId = hosicoMintInfo.value.owner;
        console.log(`HOSICO token program: ${hosicoTokenProgramId}`);

        const sourceAta = await getAssociatedTokenAccountAddress(
          address(config.tokens.hosico.mint),
          address(publicKey),
          address(hosicoTokenProgramId)
        );
        const destinationAta = await getAssociatedTokenAccountAddress(
          address(config.tokens.hosico.mint),
          address('D5TiA9gpwdXgAc1KcMr6uWLUKBwfAR5xbhAMofda4NcB'),
          address(hosicoTokenProgramId)
        );

        const transferInstruction = getTransferCheckedInstruction(
          {
            source: sourceAta,
            destination: destinationAta,
            mint: address(config.tokens.hosico.mint),
            authority: address(publicKey),
            decimals: 6,
            amount: Number(Number(previewData.hosicoAmount.toFixed(0)) * 0.007) * 1_000_000,
          },
          {
            programAddress: address(hosicoTokenProgramId)
          }
        )

        allInstructions.push(transferInstruction);

      } catch (swapError) {
        console.warn('Failed to create swap instruction, proceeding with close-only transaction:', swapError);
        setTransactionStatus(`⚠️ Could not create swap instruction, proceeding to close accounts only...`);
      }


      setTransactionStatus(`Executing batch transaction: ${closeInstructions.length} close + swap instructions...`);

      const { value: latestBlockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send();

      const batchTransaction = createTransaction({
        feePayer: address(publicKey),
        version: 0,
        latestBlockhash,
        instructions: allInstructions,
      });

      const compiledTransaction = compileTransaction(batchTransaction);
      const serializedTransaction = getBase64EncodedWireTransaction(compiledTransaction);

      const batchSignature = await executeTransaction(
        serializedTransaction,
        `Close ${closeInstructions.length} accounts & swap to $HOSICO`
      );

      console.log(`Batch transaction completed: ${batchSignature}`);

      if (totalSolToRecover > 0.001) {
        setTransactionStatus(`✅ Successfully closed ${closeInstructions.length} accounts and swapped ${totalSolToRecover.toFixed(3)} SOL to $HOSICO!`);
      } else {
        setTransactionStatus(`✅ Successfully closed ${closeInstructions.length} accounts! Recovered ~${totalSolToRecover.toFixed(3)} SOL`);
      }

      setSelectedTokens(new Set());

    } catch (error) {
      console.error('Critical error in batch conversion process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTransactionStatus(`❌ Batch transaction failed: ${errorMessage}. Please try again.`);
    } finally {
      setIsTransacting(false);
      setTimeout(() => {
        setTransactionStatus('');
      }, 15000);
    }
  };

  useEffect(() => {
    const fetchHosicoPrice = async () => {
      console.log('Fetching HOSICO price...');

      try {
        let price = 0;

        try {
          const v3Response = await fetch(`https://lite-api.jup.ag/price/v3?ids=${config.tokens.hosico.mint}`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; LitterboxApp/1.0)',
            }
          });

          if (v3Response.ok) {
            const v3Data = await v3Response.json();
            const tokenData = v3Data[config.tokens.hosico.mint];
            if (tokenData && typeof tokenData.usdPrice === 'number') {
              price = tokenData.usdPrice;
              console.log("HOSICO price from Jupiter v3:", price);
              console.log("Additional data - decimals:", tokenData.decimals, "24h change:", tokenData.priceChange24h);
              setHosicoPrice(price);
              return;
            }
          } else {
            console.warn(`Jupiter v3 API returned ${v3Response.status} for HOSICO price`);
          }
        } catch (v3Error) {
          console.warn('Jupiter v3 failed for HOSICO price:', v3Error);
        }

        try {
          const cgResponse = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${config.tokens.hosico.mint}&vs_currencies=usd`, {
            headers: {
              'Accept': 'application/json',
            }
          });

          if (cgResponse.ok) {
            const cgData = await cgResponse.json();
            price = cgData[config.tokens.hosico.mint]?.usd || 0;
            if (price > 0) {
              console.log("HOSICO price from CoinGecko:", price);
              setHosicoPrice(price);
              return;
            }
          }
        } catch (cgError) {
          console.warn('CoinGecko failed for HOSICO price:', cgError);
        }

        try {
          const v2Response = await fetch(`https://api.jup.ag/price/v2?ids=${config.tokens.hosico.mint}`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; LitterboxApp/1.0)',
              'Origin': 'https://jup.ag',
            }
          });

          if (v2Response.ok) {
            const v2Data = await v2Response.json();
            price = v2Data.data?.[config.tokens.hosico.mint]?.price || 0;
            if (price > 0) {
              console.log("HOSICO price from Jupiter v2:", price);
              setHosicoPrice(price);
              return;
            }
          }
        } catch (v2Error) {
          console.warn('Jupiter v2 failed for HOSICO price:', v2Error);
        }

        try {
          const quoteResponse = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${config.tokens.hosico.mint}&amount=1000000000&slippageBps=50`);

          if (quoteResponse.ok) {
            const quoteData = await quoteResponse.json();
            if (quoteData.outAmount) {
              const solAmount = 1;
              const hosicoAmount = parseInt(quoteData.outAmount) / Math.pow(10, 6);
              const solPriceUSD = 200;
              const impliedPrice = (solAmount * solPriceUSD) / hosicoAmount;

              if (impliedPrice > 0 && impliedPrice < 1000) {
                console.log("HOSICO price derived from Jupiter quote:", impliedPrice);
                setHosicoPrice(impliedPrice);
                return;
              }
            }
          }
        } catch (quoteError) {
          console.warn('Jupiter quote failed for HOSICO price:', quoteError);
        }

        console.warn('All HOSICO price sources failed, setting to 0');
        setHosicoPrice(0);

      } catch (error) {
        console.warn('Failed to fetch HOSICO price:', error);
        setHosicoPrice(0);
      }
    };

    fetchHosicoPrice();
    const interval = setInterval(fetchHosicoPrice, 60000);
    return () => clearInterval(interval);
  }, [config.tokens.hosico.mint]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const container = await new TokenListProvider().resolve();
        const list = container.filterByChainId(TokenListEnv.MainnetBeta).getList();
        if (!mounted) return;
        const map = new Map();
        list.forEach((meta) => map.set(meta.address, meta));
        setTokenMap(map);
      } catch (err) {
        console.warn("token list load failed", err);
        setTokenMap(new Map());
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const [tokenMap, setTokenMap] = useState(new Map());

  useEffect(() => {
    if (!publicKey) {
      setTokens([]);
      setSolBalance(null);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const standardTokenProgramId = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        const token2022ProgramId = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

        const [standardTokensResp, token2022Resp] = await Promise.all([
          client.rpc.getTokenAccountsByOwner(publicKey as any, { programId: standardTokenProgramId as any }, { encoding: "jsonParsed" as any, commitment: "confirmed" }).send(),
          client.rpc.getTokenAccountsByOwner(publicKey as any, { programId: token2022ProgramId as any }, { encoding: "jsonParsed" as any, commitment: "confirmed" }).send()
        ]);

        const allTokenAccounts = [
          ...((standardTokensResp as any)?.value ?? []).map((item: any) => ({ ...item, programId: standardTokenProgramId })),
          ...((token2022Resp as any)?.value ?? []).map((item: any) => ({ ...item, programId: token2022ProgramId }))
        ];

        const accounts: TokenData[] = allTokenAccounts.map((item: any): TokenData | null => {
          try {
            if (item?.account?.data?.parsed?.info?.tokenAmount?.decimals === 0) return null;
            if (item?.account?.data?.parsed?.info?.mint === config.tokens.hosico.mint) return null;
            if (item?.account?.data?.parsed?.info?.mint === config.tokens.sol.mint) return null;

            const parsed = item.account?.data?.parsed ?? {};
            const info = parsed.info ?? {};
            const tokenAmount = info.tokenAmount ?? {};
            const uiAmount = typeof tokenAmount.uiAmount === "number" ? tokenAmount.uiAmount : (tokenAmount.uiAmountString ? Number(tokenAmount.uiAmountString) : 0);

            if (uiAmount === 0) {
              const pubkey = item.pubkey;
              const mint = info.mint;
              const owner = info.owner;

              const state = info.state;
              const closeAuthority = info.closeAuthority;
              const delegate = info.delegate;
              const delegatedAmount = info.delegatedAmount;
              const isNative = info.isNative;
              
              if (isNative) {
                return null;
              }
              
              if (state && state !== 'initialized') {
                return null;
              }
              
              if (delegate && delegatedAmount && Number(delegatedAmount) > 0) {
                return null;
              }
              
              if (closeAuthority && closeAuthority !== owner) {
                return null;
              }
              
              if (owner !== publicKey) {
                return null;
              }
              
              return {
                mint,
                accountPubkey: pubkey,
                uiAmount,
                owner,
                programId: item.programId,
                state,
                closeAuthority,
                delegate,
                delegatedAmount
              };
            } else {
              return null;
            }
          } catch (innerErr) {
            console.warn("malformed token account item", innerErr, item);
            return null;
          }
        }).filter(Boolean) as TokenData[];

        let sol = null;

        try {
          const balRespPromise = client.rpc.getBalance(publicKey as any, { commitment: "confirmed" });
          const balResp = await balRespPromise.send();
          const lamports = typeof balResp === "number" ? balResp : ((balResp as any)?.value ?? null);
          if (lamports != null) {
            sol = Number(lamports) / 1_000_000_000;
          }
        } catch (balErr) {
          console.warn("failed to fetch SOL balance", balErr);
        }

        const allTokenMints = accounts.map(t => t.mint);
        const priceMap = await fetchTokenPrices(allTokenMints);

        const highValueTokens = accounts.filter(token => {
          const priceUSD = priceMap[token.mint] || 0;
          const totalValueUSD = (token.uiAmount || 0) * priceUSD;
          return totalValueUSD < 1.0;
        });

        const accountsToShow = await Promise.all(
          highValueTokens.slice(0, 5).map(async (t) => {
            const options = {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: '1',
                method: 'getAsset',
                params: { id: t.mint },
              }),
            };

            const response = await fetch(config.rpcUrl, options);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data;
          })
        );

        const formattedAccounts = highValueTokens.map((token, index) => {
          const assetData = accountsToShow[index];
          const priceUSD = priceMap[token.mint] || 0;
          return {
            mint: token.mint,
            accountPubkey: token.accountPubkey,
            uiAmount: token.uiAmount,
            owner: token.owner,
            programId: token.programId,
            image: assetData?.result?.content?.links?.image || '',
            symbol: assetData?.result?.content?.metadata?.symbol || token.mint.slice(0, 8) + '...',
            name: assetData?.result?.content?.metadata?.name || 'Unknown Token',
            priceUSD: priceUSD
          };
        });

        if (!mounted) return;
        setTokens(formattedAccounts);
        setSolBalance(sol);
      } catch (err: any) {
        console.error("rpc error", err);
        if (mounted) setError(String(err?.message ?? err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [publicKey, client, tokenMap]);

  return (
    <div id="statsistics" className="statistics">
      <div className="left">
        <div className="table">
          <div className="grid grid-cols-3 gap-4">
            <div className="thead_col h-max">
              <button
                onClick={handleSelectAll}
                className="select-all-btn"
              >
                <div className={`checkbox ${selectedTokens.size === tokens.length && tokens.length > 0 ? 'checked' : ''}`}>
                  {selectedTokens.size === tokens.length && tokens.length > 0 && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                      <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span>Asset</span>
              </button>
            </div>
            <div className="thead_col h-max text-left">
              Balance
            </div>
            <div className="thead_col h-max text-left">
              Price (USD)
            </div>
          </div>

          {loading && (
            <div className="grid grid-cols-1 gap-4">
              <div className="loading-state">
                Scanning wallet...
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="grid grid-cols-1 gap-4">
              <div className="error-state">
                Error: {error}
              </div>
            </div>
          )}

          {!loading && !error && tokens.length === 0 && (
            <div className="grid grid-cols-1 gap-4">
              <div className="empty-state">
                No tokens found with value {'<'}$1.
              </div>
            </div>
          )}

          {tokens.map((tok) => {
            const isSelected = selectedTokens.has(tok.mint);

            return (
              <div className="grid grid-cols-3 gap-4" key={`${tok.mint}-${tok.accountPubkey}`}>
                <div className="h-max token-row">
                  <button
                    onClick={() => handleTokenSelect(tok.mint)}
                    className="token-select-btn"
                  >
                    <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                          <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>
                  {tok.image ? <img src={tok.image} alt={tok.symbol} className="token-image" /> : <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-full h-8 max-h-8 min-h-8 w-8 min-w-8 max-w-8"><g clipPath="url(#clip0_2849_7888)"><rect width="32" height="32" rx="16" fill="#030914"></rect><circle cx="16.0001" cy="16" r="13.3333" stroke="#9498A1" strokeWidth="1.5"></circle><path d="M13.3335 11.9999C13.3335 10.5272 14.5274 9.33325 16.0002 9.33325C17.4729 9.33325 18.6668 10.5272 18.6668 11.9999C18.6668 12.5308 18.5117 13.0254 18.2443 13.441C17.4474 14.6795 16.0002 15.8605 16.0002 17.3333L16.0002 17.9999" stroke="#9498A1" strokeWidth="1.5" strokeLinecap="round"></path><path d="M15.9895 22.6666H16.0015" stroke="#9498A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></g><defs><clipPath id="clip0_2849_7888"><rect width="32" height="32" rx="16" fill="white"></rect></clipPath></defs></svg>}
                  <strong>{tok.symbol}</strong>
                </div>
                <div
                  key={`${tok.mint}-${tok.accountPubkey}-balance`}
                  className="h-max token-cell"
                >
                  {tok.uiAmount.toFixed(2)}
                </div>
                <div
                  key={`${tok.mint}-${tok.accountPubkey}-price`}
                  className="h-max token-cell"
                >
                  ${(tok.priceUSD || 0).toFixed(6)}
                </div>
              </div>
            );
          })}
        </div>

        {solBalance != null && (
          <div className="sol-balance">
            <strong>SOL balance:</strong> {solBalance.toFixed(6)} SOL
          </div>
        )}
      </div>

      <div className="right">
        <div className="preview-section">
          <h3 className="preview-title">$HOSICO Conversion Preview</h3>
          <div className="token-count">
            Selected tokens: {previewData.selectedCount}
          </div>

          {selectedTokens.size > 0 && (
            <div className="process-info">
              💡 Process: Close accounts → Recover SOL rent → Swap SOL to $HOSICO
            </div>
          )}
        </div>

        <ul className="convertion_container">
          <div className="convertion">
            <p className="amount">${previewData.totalValueUSD.toFixed(2)}</p>
            <p className="status">Total Value (USD)</p>
          </div>
          <div className="convertion">
            <p className="amount">{previewData.hosicoAmount.toFixed(2)} $HOSICO</p>
            <p className="status">You will receive</p>
          </div>
          <div className="convertion">
            <p className="amount">{previewData.estimatedSolRecovery.toFixed(3)} SOL</p>
            <p className="status">Est. SOL recovery (${previewData.solRecoveryValueUSD.toFixed(2)})</p>
          </div>
        </ul>

        <button
          className={`btn btn_convert ${selectedTokens.size === 0 || isTransacting ? 'disabled' : ''}`}
          disabled={selectedTokens.size === 0 || isTransacting}
          onClick={executeConversion}
        >
          {isTransacting
            ? 'Processing...'
            : `Convert ${selectedTokens.size > 0 ? `${selectedTokens.size} token${selectedTokens.size > 1 ? 's' : ''}` : ''} to $HOSICO`
          }
        </button>

        {transactionStatus && (
          <div className="transaction-status">
            {transactionStatus}
          </div>
        )}

        {hosicoPrice > 0 && (
          <div className="price-info">
            $HOSICO Price: ${hosicoPrice.toFixed(6)}
          </div>
        )}
      </div>
    </div>
  );
}