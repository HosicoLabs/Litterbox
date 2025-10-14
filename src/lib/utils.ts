import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fetchTokenPrices = async (tokenMints: string[]): Promise<Record<string, number>> => {
  try {
    const chunks = [];
    for (let i = 0; i < tokenMints.length; i += 50) {
      chunks.push(tokenMints.slice(i, i + 50));
    }

    const allPrices: Record<string, number> = {};

    for (const chunk of chunks) {

      try {
        const idsParam = chunk.join(',');

        try {
          const v3Response = await fetch(`https://lite-api.jup.ag/price/v3?ids=${idsParam}`);

          if (v3Response.ok) {
            const v3Data = await v3Response.json();

            chunk.forEach(mint => {
              const tokenData = v3Data[mint];
              if (tokenData && typeof tokenData.usdPrice === 'number') {
                allPrices[mint] = tokenData.usdPrice;
              } else {
                allPrices[mint] = 0;
              }
            });

            if (Object.keys(v3Data).length > 0) {
              await new Promise(resolve => setTimeout(resolve, 200));
              continue;
            }
          }
        } catch (v3Error) {
          console.warn('Jupiter v3 API failed for chunk:', v3Error);
        }

        try {
          const cgResponse = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${idsParam}&vs_currencies=usd`);

          if (cgResponse.ok) {
            const cgData = await cgResponse.json();

            chunk.forEach(mint => {
              const price = cgData[mint]?.usd;
              if (typeof price === 'number' && !allPrices[mint]) {
                allPrices[mint] = price;
              } else if (!allPrices[mint]) {
                allPrices[mint] = 0;
              }
            });

            await new Promise(resolve => setTimeout(resolve, 200));
            continue;
          }
        } catch (cgError) {
          console.warn('CoinGecko API failed for chunk:', cgError);
        }

        chunk.forEach(mint => {
          if (!allPrices[mint]) {
            allPrices[mint] = 0;
          }
        });

      } catch (err) {
        console.warn(`Failed to fetch prices for chunk:`, chunk, err);
        chunk.forEach(mint => {
          allPrices[mint] = 0;
        });
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return allPrices;
  } catch (error) {
    console.warn('Failed to fetch token prices:', error);
    return {};
  }
};