import Image from "next/image";
import styles from "./page.module.css";
import { Hero } from "@/components/hero/hero";

export default function Home() {
  return (
    <main>
      <Hero />
      <h1>litter box</h1>
    </main>
  );
}
