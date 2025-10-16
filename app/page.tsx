'use client'

import { Footer } from "../components/footer/footer";
import { Hero } from "../components/hero/hero";
import { useSolana } from "../components/solana/use-solana";
import { Statistics } from "../components/statistics/statitistics";
import { StatisticsDisconnected } from "../components/statistics/statistics-disconnected";
import { Steps } from "../components/steps/steps";

export default function Home() {
  const { account, client, cluster } = useSolana()
  console.log(cluster.id)
  const publicKey = account?.address

  return (
    <main>
      <Hero />
      <Steps />
      {
        account && publicKey && cluster.id === 'solana:mainnet' ? (
          <Statistics 
            account={account} 
            publicKey={publicKey} 
            client={client}
          />
        ) : (
          <StatisticsDisconnected />
        )
      }
      <Footer />
    </main>
  );
}
