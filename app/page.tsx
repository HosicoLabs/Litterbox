import { Footer } from "@/components/footer/footer";
import { Hero } from "@/components/hero/hero";
import { Statistics } from "@/components/statistics/statitistics";
import { Steps } from "@/components/steps/steps";
import { JSX } from "react";

export default function Home(): JSX.Element {
  return (
    <main>
      <Hero />
      <Steps />
      <Statistics />
      <Footer />
    </main>
  );
}
