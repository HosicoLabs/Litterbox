'use client'

import { useEffect, useState } from "react";
import {
  createTransaction,
  address,
  signAndSendTransactionMessageWithSigners,
  getBase58Decoder,
  SolanaClient,
  compileTransaction,
  getBase64EncodedWireTransaction
} from "gill";
import { TokenListProvider, ENV as TokenListEnv } from "@solana/spl-token-registry";
import { UiWalletAccount, useSignAndSendTransaction, useWalletUiSigner } from "@wallet-ui/react";
import { TokenData } from "@/types";
import { config } from "@/config";
import { fetchTokenPrices } from "@/lib/utils";
import { getCloseAccountInstruction } from "gill/programs";

export function Statistics({
  account,
  publicKey,
  client
}: {
  account: UiWalletAccount,
  publicKey: string,
  client: SolanaClient<string>
}) {

  const signer = useWalletUiSigner({ account });

  const signAndSendTransaction = useSignAndSendTransaction(
    account,
    'solana:mainnet'
  )

  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [hosicoPrice, setHosicoPrice] = useState<number>(0);
  const [isTransacting, setIsTransacting] = useState(false);
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

  const getJupiterSwapTransaction = async (inputMint: string, amount: number, slippageBps: number = 300) => {
    try {
      const quoteUrl = `https://lite-api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${config.hosicoMint}&amount=${Math.floor(amount * Math.pow(10, 6))}&slippageBps=${slippageBps}&restrictIntermediateTokens=true`;

      const response = await fetch(quoteUrl);

      console.log("Jupiter quote response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Quote API error response:", errorText);
        throw new Error(`Quote API error: ${response.status} - ${errorText}`);
      }

      const quoteResponse = await response.json();
      console.log("Quote response:", quoteResponse);

      const swapResponse = await fetch('https://lite-api.jup.ag/swap/v1/swap', {
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
        console.error("Swap API error response:", errorText);
        throw new Error(`Swap API error: ${swapResponse.status} - ${errorText}`);
      }

      const swapData = await swapResponse.json();
      console.log("Swap response:", swapData);

      return swapData.swapTransaction;
    } catch (error) {
      console.error('Jupiter swap error:', error);
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
      const closeInstruction = getCloseAccountInstruction({
        account: address(tokenAccountPubkey),
        destination: address(destination),
        owner: address(authority)
      }, {
        programAddress: address(programId)
      });
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

  const createCloseAccountTransaction = async (
    tokenAccountPubkey: string,
    destination: string,
    authority: string,
    programId: string
  ) => {
    try {
      if (!account || !signer) {
        throw new Error('Wallet not connected - account or signer not available');
      }

      // Get the latest blockhash for the transaction
      const { value: latestBlockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send();

      // Create the close account instruction with program ID support for Token-2022
      const closeInstruction = createCloseAccountInstruction(
        tokenAccountPubkey,
        destination,
        authority,
        programId
      );

      // Create the transaction using gill's createTransaction  
      const transaction = createTransaction({
        feePayer: address(publicKey),
        version: 0,
        latestBlockhash,
        instructions: [closeInstruction],
      });

      // Compile and serialize the transaction
      const compiledTransaction = compileTransaction(transaction);
      const serializedTransaction = getBase64EncodedWireTransaction(compiledTransaction);

      // Use executeTransaction to sign and send
      const signature = await executeTransaction(serializedTransaction, `Close ${tokenAccountPubkey} account`);

      console.log('Close account transaction signature:', signature);
      return signature;
    } catch (error) {
      console.error('Error creating close account transaction:', error);
      throw error;
    }
  };

  const executeConversion = async () => {
    if (selectedTokens.size === 0) {
      setTransactionStatus('Please select tokens');
      return;
    }

    setIsTransacting(true);
    setTransactionStatus('Preparing transactions...');

    try {
      const selectedTokensList = tokens.filter(token => selectedTokens.has(token.mint));

      setTransactionStatus(`Processing ${selectedTokensList.length} tokens...`);

      let successCount = 0;
      let errorCount = 0;
      let totalSolRecovered = 0;

      for (let i = 0; i < selectedTokensList.length; i++) {
        const token = selectedTokensList[i];
        setTransactionStatus(`Processing ${token.symbol} (${i + 1}/${selectedTokensList.length})...`);

        try {
          const tokenValueUSD = (token.uiAmount || 0) * (token.priceUSD || 0);

          // if (tokenValueUSD > 0.001) {
          //   try {
          //     setTransactionStatus(`Swapping ${token.symbol} to $HOSICO...`);

          //     const swapTx = await getJupiterSwapTransaction(
          //       token.mint,
          //       token.uiAmount || 0
          //     );

          //     if (swapTx) {
          //       const swapSignature = await executeTransaction(
          //         swapTx,
          //         `Swap ${token.symbol} to HOSICO`
          //       );
          //       console.log(`Swap completed: ${swapSignature}`);
          //     }

          //   } catch (swapError) {
          //     console.warn(`Swap failed for ${token.symbol}, proceeding to close account:`, swapError);
          //   }
          // }

          // setTransactionStatus(`Closing ${token.symbol} account to recover SOL...`);

          try {
            setTransactionStatus(`Closing ${token.symbol} account to recover SOL...`);

            // Validate that we own this token account
            if (token.owner !== publicKey) {
              console.warn(`Cannot close ${token.symbol} account: owned by ${token.owner}, but wallet is ${publicKey}`);
              setTransactionStatus(`⚠️ Cannot close ${token.symbol} account: not owned by this wallet`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              return;
            }

            const closeSignature = await createCloseAccountTransaction(
              token.accountPubkey,
              publicKey,
              token.owner,  // Use the actual owner as the authority
              token.programId // Pass the program ID for Token-2022 support
            );

            console.log(`Account closed: ${closeSignature}`);
            totalSolRecovered += config.tokenAccountRentExemption;

            setTransactionStatus(`✅ Closed ${token.symbol} account, recovered ~${config.tokenAccountRentExemption} SOL`);
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (closeError) {
            console.warn(`Failed to close account for ${token.symbol}:`, closeError);
            setTransactionStatus(`⚠️ Could not close ${token.symbol} account: ${closeError instanceof Error ? closeError.message : 'Unknown error'}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          successCount++;

        } catch (error) {
          console.error(`Failed to process ${token.symbol}:`, error);
          errorCount++;

          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setTransactionStatus(`❌ Failed to process ${token.symbol}: ${errorMessage}`);

          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (totalSolRecovered > 0.001) {
        try {
          setTransactionStatus(`Swapping recovered SOL (${totalSolRecovered.toFixed(3)}) to $HOSICO...`);

          const solSwapTx = await getJupiterSwapTransaction(
            'So11111111111111111111111111111111111111112',
            totalSolRecovered
          );

          if (solSwapTx) {
            const solSwapSignature = await executeTransaction(
              solSwapTx,
              `Swap recovered SOL to HOSICO`
            );
            console.log(`SOL swap completed: ${solSwapSignature}`);
          }

        } catch (solSwapError) {
          console.warn(`Failed to swap recovered SOL:`, solSwapError);
          setTransactionStatus(`⚠️ Tokens processed but SOL swap failed: ${solSwapError instanceof Error ? solSwapError.message : 'Unknown error'}`);
        }
      }

      if (errorCount === 0) {
        setTransactionStatus(`✅ Successfully processed ${successCount} tokens! Recovered ~${totalSolRecovered.toFixed(3)} SOL and swapped to $HOSICO.`);
        setSelectedTokens(new Set());
      } else if (successCount > 0) {
        setTransactionStatus(`⚠️ Partial success: ${successCount} completed, ${errorCount} failed. Recovered ~${totalSolRecovered.toFixed(3)} SOL.`);
      } else {
        setTransactionStatus(`❌ All transactions failed (${errorCount} failures). Please check your connection and try again.`);
      }

    } catch (error) {
      console.error('Critical error in conversion process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTransactionStatus(`❌ Critical error: ${errorMessage}. Please try again or contact support.`);
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
          const v3Response = await fetch(`https://lite-api.jup.ag/price/v3?ids=${config.hosicoMint}`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; LitterboxApp/1.0)',
            }
          });

          if (v3Response.ok) {
            const v3Data = await v3Response.json();
            const tokenData = v3Data[config.hosicoMint];
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
          const cgResponse = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${config.hosicoMint}&vs_currencies=usd`, {
            headers: {
              'Accept': 'application/json',
            }
          });

          if (cgResponse.ok) {
            const cgData = await cgResponse.json();
            price = cgData[config.hosicoMint]?.usd || 0;
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
          const v2Response = await fetch(`https://api.jup.ag/price/v2?ids=${config.hosicoMint}`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; LitterboxApp/1.0)',
              'Origin': 'https://jup.ag',
            }
          });

          if (v2Response.ok) {
            const v2Data = await v2Response.json();
            price = v2Data.data?.[config.hosicoMint]?.price || 0;
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
          const quoteResponse = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${config.hosicoMint}&amount=1000000000&slippageBps=50`);

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
  }, [config.hosicoMint]);

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

        // Fetch token accounts from both programs
        const [standardTokensResp, token2022Resp] = await Promise.all([
          client.rpc.getTokenAccountsByOwner(publicKey as any, { programId: standardTokenProgramId as any }, { encoding: "jsonParsed" as any, commitment: "finalized" }).send(),
          client.rpc.getTokenAccountsByOwner(publicKey as any, { programId: token2022ProgramId as any }, { encoding: "jsonParsed" as any, commitment: "finalized" }).send()
        ]);

        console.log("Standard token accounts response:", standardTokensResp);
        console.log("Token-2022 accounts response:", token2022Resp);

        // Combine accounts from both programs
        const allTokenAccounts = [
          ...((standardTokensResp as any)?.value ?? []).map((item: any) => ({ ...item, programId: standardTokenProgramId })),
          ...((token2022Resp as any)?.value ?? []).map((item: any) => ({ ...item, programId: token2022ProgramId }))
        ];

        const accounts: TokenData[] = allTokenAccounts.map((item: any): TokenData | null => {
          try {
            if (item?.account?.data?.parsed?.info?.tokenAmount?.decimals === 0) return null;
            if (item?.account?.data?.parsed?.info?.mint === config.hosicoMint) return null;

            if (item?.account?.data?.parsed?.info?.tokenAmount?.uiAmount === 0) {
              const pubkey = item.pubkey;
              const parsed = item.account?.data?.parsed ?? {};
              const info = parsed.info ?? {};
              const mint = info.mint;
              const owner = info.owner; // Extract the actual owner/authority
              const tokenAmount = info.tokenAmount ?? {};
              const uiAmount = typeof tokenAmount.uiAmount === "number" ? tokenAmount.uiAmount : (tokenAmount.uiAmountString ? Number(tokenAmount.uiAmountString) : 0);

              console.log(`Token account ${pubkey}: mint=${mint}, owner=${owner}, uiAmount=${uiAmount}, program=${item.programId}`);

              return {
                mint,
                accountPubkey: pubkey,
                uiAmount,
                owner,
                programId: item.programId,
              };
            } else {
              return null
            };
          } catch (innerErr) {
            console.warn("malformed token account item", innerErr, item);
            return null;
          }
        }).filter(Boolean) as TokenData[];

        console.log(`Found ${accounts.length} token accounts total`);

        let sol = null;
        try {
          const balRespPromise = client.rpc.getBalance(publicKey as any, { commitment: "finalized" });
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
        <div className="table" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          borderRadius: '8px',
          height: "auto",
          overflow: 'hidden'
        }}>
          <div className="grid grid-cols-3 gap-4">
            <div className="thead_col h-max" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              fontWeight: 'bold'
            }}>
              <button
                onClick={handleSelectAll}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #FFBB00',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selectedTokens.size === tokens.length && tokens.length > 0 ? '#FFBB00' : 'transparent'
                }}>
                  {selectedTokens.size === tokens.length && tokens.length > 0 && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                      <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span>Asset</span>
              </button>
            </div>
            <div className="thead_col h-max text-left" style={{
              padding: '12px 16px',
              fontWeight: 'bold',
              textAlign: 'left'
            }}>
              Balance
            </div>
            <div className="thead_col h-max text-left" style={{
              padding: '12px 16px',
              fontWeight: 'bold',
              textAlign: 'left'
            }}>
              Price (USD)
            </div>

          </div>



          {loading && (
            <div className="grid grid-cols-1 gap-4">
              <div style={{ padding: '16px', textAlign: 'center' }}>
                Scanning wallet...
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="grid grid-cols-1 gap-4">
              <div style={{ padding: '16px', textAlign: 'center', color: 'red' }}>
                Error: {error}
              </div>
            </div>
          )}

          {!loading && !error && tokens.length === 0 && (
            <div className="grid grid-cols-1 gap-4">
              <div style={{ padding: '16px', textAlign: 'center' }}>
                No tokens found with value {'<'}$1.
              </div>
            </div>
          )}

          {tokens.map((tok) => {
            const totalValueUSD = (tok.uiAmount || 0) * (tok.priceUSD || 0);
            const isSelected = selectedTokens.has(tok.mint);

            return (
              <div className="grid grid-cols-3 gap-4" key={`${tok.mint}-${tok.accountPubkey}`}>
                <div
                  className="h-max"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: '12px 16px',
                  }}
                >
                  <button
                    onClick={() => handleTokenSelect(tok.mint)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      marginRight: '8px'
                    }}
                  >
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #FFBB00',
                      borderRadius: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected ? '#FFBB00' : 'transparent'
                    }}>
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                          <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>
                  {tok.image ? <img src={tok.image} alt={tok.symbol} style={{ width: 32, height: 32, borderRadius: 4 }} /> : <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-full h-8 max-h-8 min-h-8 w-8 min-w-8 max-w-8"><g clipPath="url(#clip0_2849_7888)"><rect width="32" height="32" rx="16" fill="#030914"></rect><circle cx="16.0001" cy="16" r="13.3333" stroke="#9498A1" strokeWidth="1.5"></circle><path d="M13.3335 11.9999C13.3335 10.5272 14.5274 9.33325 16.0002 9.33325C17.4729 9.33325 18.6668 10.5272 18.6668 11.9999C18.6668 12.5308 18.5117 13.0254 18.2443 13.441C17.4474 14.6795 16.0002 15.8605 16.0002 17.3333L16.0002 17.9999" stroke="#9498A1" strokeWidth="1.5" strokeLinecap="round"></path><path d="M15.9895 22.6666H16.0015" stroke="#9498A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></g><defs><clipPath id="clip0_2849_7888"><rect width="32" height="32" rx="16" fill="white"></rect></clipPath></defs></svg>}
                  <strong>{tok.symbol}</strong>
                </div>
                <div
                  key={`${tok.mint}-${tok.accountPubkey}-balance`}
                  className="h-max"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {tok.uiAmount.toFixed(2)}
                </div>
                <div
                  key={`${tok.mint}-${tok.accountPubkey}-price`}
                  className="h-max"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  ${(tok.priceUSD || 0).toFixed(6)}
                </div>
              </div>
            );
          })}
        </div>

        {solBalance != null && (
          <div style={{ marginTop: 12 }}>
            <strong>SOL balance:</strong> {solBalance.toFixed(6)} SOL
          </div>
        )}
      </div>

      <div className="right">
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>$HOSICO Conversion Preview</h3>
          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            Selected tokens: {previewData.selectedCount}
          </div>

          {selectedTokens.size > 0 && (
            <div style={{
              fontSize: '0.75rem',
              opacity: 0.7,
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 187, 0, 0.05)',
              borderRadius: '4px',
              border: '1px solid rgba(255, 187, 0, 0.2)'
            }}>
              💡 Process: Swap tokens to $HOSICO → Close accounts → Recover SOL rent
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
          className="btn btn_convert"
          disabled={selectedTokens.size === 0 || isTransacting}
          onClick={executeConversion}
          style={{
            opacity: selectedTokens.size === 0 || isTransacting ? 0.5 : 1,
            cursor: selectedTokens.size === 0 || isTransacting ? 'not-allowed' : 'pointer'
          }}
        >
          {isTransacting
            ? 'Processing...'
            : `Convert ${selectedTokens.size > 0 ? `${selectedTokens.size} token${selectedTokens.size > 1 ? 's' : ''}` : ''} to $HOSICO`
          }
        </button>

        {transactionStatus && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: 'rgba(255, 187, 0, 0.1)',
            border: '1px solid rgba(255, 187, 0, 0.3)',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            {transactionStatus}
          </div>
        )}

        {hosicoPrice > 0 && (
          <div style={{ marginTop: '1rem', fontSize: '0.75rem', opacity: 0.6 }}>
            $HOSICO Price: ${hosicoPrice.toFixed(6)}
          </div>
        )}
      </div>
    </div>
  );
}